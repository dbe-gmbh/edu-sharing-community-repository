import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from 'ngx-edu-sharing-api';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    @Input()
    get searchString(): string {
        return this._searchString;
    }
    set searchString(value: string) {
        this._searchString = value;
        this.onSearchStringChanged();
    }
    private _searchString: string;

    constructor(
        private router: Router,
        /**
         * service to allow access for sending authentication data
         */
        public authenticationService: AuthenticationService,
    ) {}

    ngOnInit(): void {
        // We need this to hook up routing to our LocationStrategy. Otherwise calls on Location
        // won't work.
        this.router.initialNavigation();
        this.goToSearch();
    }

    private onSearchStringChanged() {
        this.goToSearch(this.searchString);
    }

    private goToSearch(searchString?: string) {
        this.router.navigate(['/components/search'], {
            queryParams: {
                mainnav: false,
                q: searchString,
            },
        });
    }
}
