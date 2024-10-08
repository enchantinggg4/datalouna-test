export default () => {

  console.log(process.env.DEV, process.env.DEV === 'true')
  return {
    isDevelopment: process.env.DEV === 'true',
    skinport: {
      clientId: process.env.SKINPORT_CLIENT_ID,
      key: process.env.SKINPORT_KEY,
      itemsEndpointTTL: parseInt(process.env.SKINPORT_ITEM_ENDPOINT_CACHE_TTL, 10) || 60 * 5 // default to 5 minutes
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT, 10) || 6379
    },

  }
};


export const API = Symbol("Skinport API")
