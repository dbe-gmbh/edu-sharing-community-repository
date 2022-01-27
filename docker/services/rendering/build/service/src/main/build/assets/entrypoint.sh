#!/bin/bash
set -eux

########################################################################################################################

my_bind="${SERVICES_RENDERING_SERVICE_BIND:-"0.0.0.0"}"

my_home_appid="${SERVICES_RENDERING_SERVICE_HOME_APPID:-esrender}"

my_prot_external="${SERVICES_RENDERING_SERVICE_PROT_EXTERNAL:-http}"
my_host_external="${SERVICES_RENDERING_SERVICE_HOST_EXTERNAL:-rendering.services.127.0.0.1.nip.io}"
my_port_external="${SERVICES_RENDERING_SERVICE_PORT_EXTERNAL:-9100}"
my_path_external="${SERVICES_RENDERING_SERVICE_PATH_EXTERNAL:-$(basename "${RS_ROOT}")}"
my_base_external="${my_prot_external}://${my_host_external}:${my_port_external}/${my_path_external}"

my_prot_internal="${SERVICES_RENDERING_SERVICE_PROT_INTERNAL:-http}"
my_host_internal="${SERVICES_RENDERING_SERVICE_HOST_INTERNAL:-services-rendering-service}"
my_port_internal="${SERVICES_RENDERING_SERVICE_PORT_INTERNAL:-8080}"
my_path_internal="${SERVICES_RENDERING_SERVICE_PATH_INTERNAL:-$(basename "${RS_ROOT}")}"
my_base_internal="${my_prot_internal}://${my_host_internal}:${my_port_internal}/${my_path_internal}"

my_proxy_host="${SERVICES_RENDERING_SERVICE_PROXY_HOST:-}"
my_proxy_port="${SERVICES_RENDERING_SERVICE_PROXY_PORT:-}"
my_proxy_user="${SERVICES_RENDERING_SERVICE_PROXY_USER:-}"
my_proxy_pass="${SERVICES_RENDERING_SERVICE_PROXY_PASS:-}"

rendering_cache_host="${SERVICES_RENDERING_CACHE_HOST:-}"
rendering_cache_port="${SERVICES_RENDERING_CACHE_PORT:-}"
rendering_cache_prot="${SERVICES_RENDERING_CACHE_PROT:-tcp://}"
rendering_cache_opts="${SERVICES_RENDERING_CACHE_OPTS:-}"
rendering_cache_type="${SERVICES_RENDERING_CACHE_TYPE:-redis}"

rendering_database_driv="${SERVICES_RENDERING_DATABASE_DRIV:-"pgsql"}"
rendering_database_host="${SERVICES_RENDERING_DATABASE_HOST:-rendering-database}"
rendering_database_name="${SERVICES_RENDERING_DATABASE_NAME:-rendering}"
rendering_database_pass="${SERVICES_RENDERING_DATABASE_PASS:-rendering}"
rendering_database_port="${SERVICES_RENDERING_DATABASE_PORT:-5432}"
rendering_database_user="${SERVICES_RENDERING_DATABASE_USER:-rendering}"

repository_service_host="${REPOSITORY_SERVICE_HOST:-repository-service}"
repository_service_port="${REPOSITORY_SERVICE_PORT:-8080}"

repository_service_base="http://${repository_service_host}:${repository_service_port}/edu-sharing"

### Wait ###############################################################################################################

[[ -n "${rendering_cache_host}" && -n "${rendering_cache_port}" ]] && {

	until wait-for-it "${rendering_cache_host}:${rendering_cache_port}" -t 3; do sleep 1; done

	[[ "${rendering_cache_type}" == "rediscluster" ]] && {
		until [[ $(redis-cli --cluster info "${rendering_cache_host}" "${rendering_cache_port}" | grep '[OK]' | cut -d ' ' -f5) -gt 1 ]]; do
			echo "."
			sleep 2
		done
	}

}

until wait-for-it "${rendering_database_host}:${rendering_database_port}" -t 3; do sleep 1; done

[[ "${rendering_database_driv}" == "mysql" ]] && {
	until mysql -h"${rendering_database_host}" -P"${rendering_database_port}" \
		-u"${rendering_database_user}" -p"${rendering_database_pass}" \
		"${rendering_database_name}" <<<'SELECT 1' &>/dev/null; do
		echo >&2 "Waiting for ${rendering_database_host} ..."
		sleep 3
	done
}

[[ "${rendering_database_driv}" == "pgsql" ]] && {
	until PGPASSWORD="${rendering_database_pass}" \
		psql -h "${rendering_database_host}" -p "${rendering_database_port}" -U "${rendering_database_user}" -d "${rendering_database_name}" -c '\q'; do
		echo >&2 "Waiting for ${rendering_database_host} ..."
		sleep 3
	done
}

until wait-for-it "${repository_service_host}:${repository_service_port}" -t 3; do sleep 1; done

until [[ $(curl -sSf -w "%{http_code}\n" -o /dev/null -H 'Accept: application/json' "${repository_service_base}/rest/_about/status/SERVICE?timeoutSeconds=3") -eq 200 ]]; do
	echo >&2 "Waiting for ${repository_service_host} service ..."
	sleep 3
done

until [[ $(curl -sSf -w "%{http_code}\n" -o /dev/null -H 'Accept: application/json' "${repository_service_base}/rest/_about/status/SEARCH?timeoutSeconds=3") -eq 200 ]]; do
	echo >&2 "Waiting for ${repository_service_host} search ..."
	sleep 3
done

########################################################################################################################

sed -i 's|^Listen \([0-9]+\)|Listen '"${my_bind}"':\1|g' /etc/apache2/ports.conf

sed -i 's|^\(\s*\)[#]*ServerName.*|\1ServerName '"${my_host_external}"'|' /etc/apache2/sites-available/external.conf
sed -i 's|^\(\s*\)[#]*ServerName.*|\1ServerName '"${my_host_internal}"'|' /etc/apache2/sites-available/internal.conf

[[ -n "${rendering_cache_host}" && -n "${rendering_cache_port}" ]] && {

	sed -i 's|^[;\s]*session\.save_handler.*|session.save_handler = '"${rendering_cache_type}"'|' "${PHP_INI_DIR}/php.ini"
	echo "session.save_path = \"${rendering_cache_prot}${rendering_cache_host}:${rendering_cache_port}${rendering_cache_opts}\"" >>"${PHP_INI_DIR}/php.ini"

}

########################################################################################################################

if [[ ! -f "${RS_CACHE}/config/version.json" ]]; then

	echo "install started."

	cat >/tmp/config.ini <<-EOF
		[application]
		; url for client requests (accessible from the internet)
		application_url_client=${my_base_external}
		; url for requests from repository
		application_url_repository=${my_base_internal}
		; ip of the server
		application_host=
		; root directory of the rendering service application
		application_root=${RS_ROOT}
		; cache directory
		application_cache=${RS_CACHE}/data
		; save cache directory (optional)
		application_cache_save=
		; path to the ffmpeg binary
		application_ffmpeg=/usr/bin/ffmpeg
		
		[database]
		; driver (mysql or pgsql)
		db_driver=${rendering_database_driv}
		; db host
		db_host=${rendering_database_host}
		; db port
		db_port=${rendering_database_port}
		; db name
		db_name=${rendering_database_name}
		; db user
		db_user=${rendering_database_user}
		; db password
		db_password=${rendering_database_pass}
		
		[repository]
		; url of the repository to fetch properties and content from
		repository_url=${repository_service_base}
	EOF

	before="$(mktemp)"

	php admin/cli/install.php -c /tmp/config.ini
	rm -f /tmp/config.ini

	echo "config saving."

	find -L . -type d -exec mkdir -p "${RS_CACHE}/config/{}" \;
	find -L . -type f -newer "${before}" -exec cp {} "${RS_CACHE}/config/{}" \;
	find "${RS_CACHE}/config" -type d -empty -delete

	cp "$RS_ROOT"/version.json "${RS_CACHE}"/config/version.json

	echo "config saved."

else

	echo "config restoring."

	pushd "${RS_CACHE}/config"

	find . -type d -exec mkdir -p "${RS_ROOT}/{}" \;
	find . -type f -exec cp -f {} "${RS_ROOT}/{}" \;

	cmp -s "$RS_ROOT"/version.json version.json || {
		mv version.json version.json."$(date +%d-%m-%Y_%H-%M-%S )"
		cp "$RS_ROOT"/version.json version.json
	}

	popd

	echo "config restored."
fi

########################################################################################################################

yes | php admin/cli/update.php

proxyConf="${RS_ROOT}/conf/proxy.conf.php"
if [[ -n $my_proxy_host ]] ; then
	cp -f "${RS_ROOT}/conf/proxy.conf.php.example" "${proxyConf}"
	sed -i -r "s|define\('HTTP_PROXY_HOST',.*);|define('HTTP_PROXY_HOST', '$my_proxy_host');|" "${proxyConf}"
	sed -i -r "s|define\('HTTP_PROXY_PORT',.*);|define('HTTP_PROXY_PORT', '$my_proxy_port');|" "${proxyConf}"
	sed -i -r "s|define\('HTTP_PROXY_USER',.*);|define('HTTP_PROXY_USER', '$my_proxy_user');|" "${proxyConf}"
	sed -i -r "s|define\('HTTP_PROXY_PASS',.*);|define('HTTP_PROXY_PASS', '$my_proxy_pass');|" "${proxyConf}"
else
	rm -f "${proxyConf}"
fi

dbConf="${RS_ROOT}/conf/db.conf.php"
sed -i -r "s|\$dsn.*|\$dsn = \"${rendering_database_driv}:host=${rendering_database_host};port=${rendering_database_port};dbname=${rendering_database_name}\";|" "${dbConf}"
sed -i -r "s|\$dbuser.*|\$dbuser = \"${rendering_database_user}\";|" "${dbConf}"
sed -i -r "s|\$pwd.*|\pwd = \"${rendering_database_pass}\";|" "${dbConf}"

systemConf="${RS_ROOT}/conf/system.conf.php"
sed -i -r "s|\$MC_URL.*|\$MC_URL = '${my_base_external}';|" "${systemConf}"
sed -i -r "s|\$MC_DOCROOT.*|\$MC_DOCROOT = '${RS_ROOT}';|" "${systemConf}"
sed -i -r "s|\$CC_RENDER_PATH.*|\$CC_RENDER_PATH = '${RS_CACHE}';|" "${systemConf}"

homeApp="${RS_ROOT}/conf/esmain/homeApplication.properties.xml"
xmlstarlet ed -L \
	-u '/properties/entry[@key="scheme"]' -v "${my_prot_internal}" \
	-u '/properties/entry[@key="host"]' -v "${my_host_internal}" \
	-u '/properties/entry[@key="port"]' -v "${my_port_internal}" \
	-u '/properties/entry[@key="appid"]' -v "${my_home_appid}" \
	"${homeApp}"

########################################################################################################################

exec "$@"