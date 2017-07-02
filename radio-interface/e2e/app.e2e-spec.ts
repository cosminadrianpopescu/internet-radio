import { RadioInterfacePage } from './app.po';

describe('radio-interface App', () => {
  let page: RadioInterfacePage;

  beforeEach(() => {
    page = new RadioInterfacePage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
