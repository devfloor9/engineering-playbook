exports.__esModule = true;
exports.default = () => ({i18n: {currentLocale: new URLSearchParams(location.search).get('locale') || 'en'}});
