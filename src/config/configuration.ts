export default () => ({
    isDevelopment: process.env.DEV === 'true',
    skinport: {
      clientId: process.env.SKINPORT_CLIENT_ID as string,
      key: process.env.SKINPORT_KEY as string,
      itemsEndpointTTL: parseInt(process.env.SKINPORT_ITEM_ENDPOINT_CACHE_TTL as string, 10) || 60 * 5 // default to 5 minutes
    },
    redis: {
      host: process.env.REDIS_HOST as string,
      port: parseInt(process.env.REDIS_PORT as string, 10) || 6379
    },

  }
);


export const API = Symbol("Skinport API")
