export const seriesSchemas = {
  list: {
    querystring: {
      type: 'object',
      properties: {
        education_level_id: { type: 'string', format: 'uuid' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                education_level_id: { type: 'string', format: 'uuid' },
                education_level_name: { type: 'string' },
                name: { type: 'string' },
                created_at: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      }
    }
  }
}
