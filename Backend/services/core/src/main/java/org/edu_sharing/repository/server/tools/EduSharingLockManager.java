package org.edu_sharing.repository.server.tools;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Semaphore;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

/**
 * for non-clustered environments
 */
public class EduSharingLockManager {
    private static final ConcurrentHashMap<String, Lock> pool = new ConcurrentHashMap<>();

    protected synchronized Lock getLock(Class clazz, String keyName) {
        Lock lock = pool.get(getKey(clazz, keyName));
        if(lock == null) {
            lock = new ReentrantLock();
            pool.put(getKey(clazz, keyName), lock);
        }
        return lock;
    }
    protected synchronized void cleanupLock(Lock lock) {
        if (!((ReentrantLock)lock).hasQueuedThreads()) {
            pool.remove(pool.entrySet().stream().filter(e -> e.getValue().equals(lock)).findAny().get().getKey());
        }
    }

    protected String getKey(Class clazz, String lockName) {
        return clazz.getName() + "_" + lockName;
    }
}
