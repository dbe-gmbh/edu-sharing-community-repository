import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

/**
 * Caches and shares return values based on arguments.
 *
 * Arguments need to be serializable.
 */
export function shareReplayReturnValue() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const returnValuesMap: { [jsonArgs: string]: any } = {};
        const originalFunction = descriptor.value;
        descriptor.value = function (this: any, ...args: any[]) {
            // console.log('called', propertyKey, args);
            const jsonArgs = serialize(args);
            if (!returnValuesMap[jsonArgs]) {
                // console.log('  cache miss');
                const observable = originalFunction.apply(this, args) as Observable<unknown>;
                returnValuesMap[jsonArgs] = observable.pipe(shareReplay(1));
            }
            return returnValuesMap[jsonArgs];
        };
    };
}

function serialize(value: any): string {
    // Sort by keys.
    return JSON.stringify(value, (_, v) =>
        v instanceof Object && !(v instanceof Array) ? sortObject(v) : v,
    );
}

function sortObject<T>(obj: T): T {
    return (Object.keys(obj) as Array<keyof T>)
        .sort()
        .reduce((acc, key) => ((acc[key] = obj[key]), acc), {} as T);
}
