import { test } from '@playwright/test';
import { CollectionsPage } from './collections.page';
import { defaultLogin, testFile1 } from './constants';
import { GeneralPage } from './general.page';
import { generateTestThingName, getBaseName, getStorageStatePath } from './util';

test.use({ storageState: getStorageStatePath(defaultLogin) });

test('should go to root collections page', async ({ page }) => {
    const collectionsPage = new CollectionsPage(page);

    await page.goto(CollectionsPage.url);
    await collectionsPage.expectToBeOnRootCollectionPage();
});

test('should show collections scope', async ({ page }) => {
    const collectionsPage = new CollectionsPage(page);

    await page.goto(CollectionsPage.url);
    await collectionsPage.expectScopeButton();
});

test('should not have any warnings or errors', async ({ page }) => {
    await Promise.all([
        new GeneralPage(page).checkConsoleMessages(),
        page.goto(CollectionsPage.url),
    ]);
});

test('should create a collection', async ({ page }) => {
    const collectionName = generateTestThingName('collection');
    const collectionsPage = new CollectionsPage(page);

    await page.goto(CollectionsPage.url);
    await collectionsPage.addPrivateCollection(collectionName);
    await collectionsPage.expectToBeOnCollectionPage(collectionName);
});

test.describe('Empty collection', () => {
    let collectionName: string;

    test.beforeEach(async ({ page }) => {
        collectionName = generateTestThingName('collection');
        const collectionsPage = new CollectionsPage(page);

        await page.goto(CollectionsPage.url);
        await collectionsPage.addPrivateCollection(collectionName);
    });

    test('should delete a collection', async ({ page }) => {
        const collectionsPage = new CollectionsPage(page);

        await collectionsPage.deleteCurrentCollection();
        await collectionsPage.expectToBeOnRootCollectionPage();
    });

    test('should upload an element', async ({ page }) => {
        const collectionsPage = new CollectionsPage(page);

        await collectionsPage.uploadFileToCurrentCollection(testFile1);
        await collectionsPage.expectToBeOnCollectionPage(collectionName);
        await collectionsPage.expectToHaveElement(getBaseName(testFile1));
    });

    test('should add an existing element', async ({ page }) => {
        const elementName = getBaseName(testFile1);
        const collectionsPage = new CollectionsPage(page);

        await collectionsPage.addElementToCurrentCollection(elementName);
        await collectionsPage.expectToBeOnCollectionPage(collectionName);
        await collectionsPage.expectToHaveElement(elementName);
    });
});

test.describe('Collection with 1 element', () => {
    let collectionName: string;
    let elementName: string;

    test.beforeEach(async ({ page }) => {
        collectionName = generateTestThingName('collection');
        elementName = getBaseName(testFile1);
        const collectionsPage = new CollectionsPage(page);

        await page.goto(CollectionsPage.url);
        await collectionsPage.addPrivateCollection(collectionName);
        await collectionsPage.addElementToCurrentCollection(elementName);
    });

    test('should remove an element from the collection', async ({ page }) => {
        const collectionsPage = new CollectionsPage(page);

        await collectionsPage.removeElementFromCurrentCollection(elementName);
        await collectionsPage.expectToBeOnCollectionPage(collectionName);
        await collectionsPage.expectNotToHaveElement(elementName);
    });
});
