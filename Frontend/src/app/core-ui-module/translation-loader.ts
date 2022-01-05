import { HttpClient } from '@angular/common/http';
import { TranslateLoader } from '@ngx-translate/core';
import { ConfigService } from 'ngx-edu-sharing-api';
import {Observable, Observer, of, concat} from 'rxjs';
import {tap, switchMap, map, catchError, reduce, first} from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Translation } from './translation';
import { TranslationSource } from './translation-source';
import * as rxjs from 'rxjs';

export const TRANSLATION_LIST = [
    'common',
    'admin',
    'recycle',
    'workspace',
    'search',
    'collections',
    'login',
    'permissions',
    'oer',
    'messages',
    'register',
    'profiles',
    'services',
    'stream',
    'override',
];

type Dictionary = { [key: string]: string | Dictionary };

export class TranslationLoader implements TranslateLoader {
    static create(http: HttpClient, config: ConfigService) {
        return new TranslationLoader(http, config);
    }

    private constructor(
        private http: HttpClient,
        private config: ConfigService,
        private prefix: string = 'assets/i18n',
        private suffix: string = '.json',
    ) {}

    /**
     * Gets the translations from the server
     */
     getTranslation(lang: string): Observable<Dictionary> {
        if (lang === 'none') {
            return of({});
        }
        this.config.setLocale(Translation.LANGUAGES[lang]);
        return rxjs
            .forkJoin({
                originalTranslations: this.getOriginalTranslations(lang).pipe(
                    // Default to empty dictionary if we got nothing
                    map((translations) => translations || {}),
                ),
                translationOverrides: this.config.getTranslationOverrides().pipe(first()),
            })
            .pipe(
                map(({ originalTranslations, translationOverrides }) =>
                    // FIXME: This will alter the object returned by `getOriginalTranslations`.
                    this.applyOverrides(originalTranslations, translationOverrides),
                ),
                catchError((error, obs) => {
                    console.error(error);
                    return of(error);
                }),
            );
    }

    private getOriginalTranslations(lang: string): Observable<Dictionary> {
        switch (this.getSource()) {
            case 'repository':
                return this.config.getDefaultTranslations().pipe(first());
            case 'local':
                return this.mergeTranslations(this.fetchTranslations(lang));
        }
    }

    private getSource(): 'repository' | 'local' {
        if (
            (environment.production &&
                Translation.getSource() === TranslationSource.Auto) ||
            Translation.getSource() === TranslationSource.Repository
        ) {
            return 'repository';
        } else {
            return 'local';
        }
    }

    /**
     * Returns an array of Observables that will each fetch a translations json
     * file.
     */
    private fetchTranslations(lang: string): Observable<Dictionary>[] {
        return TRANSLATION_LIST.map(
            translation =>
                `${this.prefix}/${translation}/${lang}${this.suffix}`,
        ).map(url => this.http.get(url) as Observable<Dictionary>);
    }

    /**
     * Takes an array as returned by `fetchTranslations` and converts it to an
     * Observable that yields a single Dictionary object.
     */
    private mergeTranslations(
        translations: Observable<Dictionary>[],
    ): Observable<Dictionary> {
        return concat(...translations).pipe(reduce(
            (acc: Dictionary, value: Dictionary) => {
                for (const prop in value) {
                    if (value.hasOwnProperty(prop)) {
                        acc[prop] = value[prop];
                    }
                }
                return acc;
            },
            {},
        ));
    }

    /**
     * Applies `overrides` to `translations` and returns `translations`.
     *
     * Example:
     *  translations = { foo: { bar: 'bar' } }
     *  overrides = { 'foo.bar': 'baz' }
     * results in
     *  translations = { foo: {bar: 'baz' } }
     *
     * @param translations Nested translations object.
     * @param overrides Flat object with dots (.) in keys interpreted as
     * separators.
     */
    private applyOverrides(
        translations: Dictionary,
        overrides: { [key: string]: string },
    ): Dictionary {
        if (overrides) {
            for (const [key, value] of Object.entries<string>(overrides)) {
                let ref = translations;
                const path = key.split('.');
                const pathLast = path.pop();
                for (const item of path) {
                    if (!ref[item]) {
                        ref[item] = {};
                    }
                    const refItem = ref[item];
                    if (typeof refItem === 'string') {
                        throw new Error(
                            'Trying to override leave with sub tree: ' + path,
                        );
                    }
                    ref = refItem;
                }
                ref[pathLast] = value;
            }
        }
        return translations;
    }
}