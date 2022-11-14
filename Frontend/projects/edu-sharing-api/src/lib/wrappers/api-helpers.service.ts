import { Injectable } from '@angular/core';
import { EduSharingApiConfiguration } from '../edu-sharing-api-configuration';
import { ApiInterceptor } from '../api.interceptor';

@Injectable()
export class ApiHelpersService {
    constructor(private configuration: EduSharingApiConfiguration) {}
    /**
     * Returns the full server url where the current api is located
     * In dev mode, it will obey the proxy url and return the "real" api url
     * @return http://localhost:8080/edu-sharing/rest
     */
    getServerUrl(): string {
        if (
            this.configuration.rootUrl.toLowerCase().startsWith('http://') ||
            this.configuration.rootUrl.toLowerCase().startsWith('https://')
        ) {
            return this.configuration.rootUrl;
        }
        let baseURL =
            location.protocol + '//' + location.hostname + (location.port && ':' + location.port);
        if (document.getElementsByTagName('base').length > 0) {
            baseURL = document.getElementsByTagName('base')[0].href;
        }
        // proxy target (i.e. in dev mode and proxy set in .env file)
        if (ApiInterceptor.proxyTarget) {
            baseURL = ApiInterceptor.proxyTarget;
        }
        if (!baseURL.endsWith('/')) baseURL += '/';
        return baseURL + this.configuration.rootUrl;
    }
}
