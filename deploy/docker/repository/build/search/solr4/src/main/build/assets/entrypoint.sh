#!/bin/bash
set -eux

########################################################################################################################

my_bind="${REPOSITORY_SEARCH_SOLR4_BIND:-"0.0.0.0"}"

my_host="${REPOSITORY_SEARCH_SOLR4_HOST:-repository-search-solr4}"
my_port="${REPOSITORY_SEARCH_SOLR4_PORT:-8080}"

repository_service_host="${REPOSITORY_SERVICE_HOST:-repository-service}"
repository_service_port="${REPOSITORY_SERVICE_PORT:-8080}"

repository_service_base="http://${repository_service_host}:${repository_service_port}/edu-sharing"

### Wait ###############################################################################################################

until wait-for-it "${repository_service_host}:${repository_service_port}" -t 3; do sleep 1; done

until [[ $( curl -sSf -w "%{http_code}\n" -o /dev/null -H 'Accept: application/json' "${repository_service_base}/rest/_about/status/SERVICE?timeoutSeconds=3" ) -eq 200 ]]
do
  >&2 echo "Waiting for ${repository_service_host} ..."
  sleep 3
done

### Tomcat #############################################################################################################

export CATALINA_OUT="/dev/stdout"
export CATALINA_OPTS="-Dfile.encoding=UTF-8 $CATALINA_OPTS"

xmlstarlet ed -L \
  -d '/Server/Service[@name="Catalina"]/Connector' \
  -s '/Server/Service[@name="Catalina"]' -t elem -n 'Connector' -v '' \
  --var internal '$prev' \
  -i '$internal' -t attr -n "address"            -v "${my_bind}" \
  -i '$internal' -t attr -n "port"               -v "8080" \
  -i '$internal' -t attr -n "scheme"             -v "http" \
  -i '$internal' -t attr -n "proxyName"          -v "${my_host}" \
  -i '$internal' -t attr -n "proxyPort"          -v "${my_port}" \
  -i '$internal' -t attr -n "protocol"           -v "HTTP/1.1" \
  -i '$internal' -t attr -n "connectionTimeout"  -v "20000" \
  tomcat/conf/server.xml

### Alfresco solr4 #####################################################################################################

prop="solr4/archive-SpacesStore/conf/solrcore.properties"

sed -i -r 's|^[#]*\s*alfresco\.host=.*|alfresco.host='"${repository_service_host}"'|' "${prop}"
grep -q   '^[#]*\s*alfresco\.host=' "${prop}" || echo "alfresco.host=${repository_service_host}" >> "${prop}"

sed -i -r 's|^[#]*\s*alfresco\.port=.*|alfresco.port='"${repository_service_port}"'|' "${prop}"
grep -q   '^[#]*\s*alfresco\.port=' "${prop}" || echo "alfresco.port=${repository_service_port}" >> "${prop}"

sed -i -r 's|^[#]*\s*alfresco\.secureComms=.*|alfresco.secureComms=none|' "${prop}"
grep -q   '^[#]*\s*alfresco\.secureComms=' "${prop}" || echo "alfresco.secureComms=none" >> "${prop}"

prop="solr4/workspace-SpacesStore/conf/solrcore.properties"

sed -i -r 's|^[#]*\s*alfresco\.host=.*|alfresco.host='"${repository_service_host}"'|' "${prop}"
grep -q   '^[#]*\s*alfresco\.host=' "${prop}" || echo "alfresco.host=${repository_service_host}" >> "${prop}"

sed -i -r 's|^[#]*\s*alfresco\.port=.*|alfresco.port='"${repository_service_port}"'|' "${prop}"
grep -q   '^[#]*\s*alfresco\.port=' "${prop}" || echo "alfresco.port=${repository_service_port}" >> "${prop}"

sed -i -r 's|^[#]*\s*alfresco\.secureComms=.*|alfresco.secureComms=none|' "${prop}"
grep -q   '^[#]*\s*alfresco\.secureComms=' "${prop}" || echo "alfresco.secureComms=none" >> "${prop}"

########################################################################################################################

exec "$@"