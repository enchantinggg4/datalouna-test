import configuration from './configuration';

export default () => ({
  ...configuration(),
  isTestEnvironment: true,
});
