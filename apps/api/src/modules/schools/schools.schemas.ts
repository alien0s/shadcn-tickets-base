export const schoolsSchemas = {
  list: {
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
                tenant_id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                abbreviation: { type: 'string' },
                active: { type: 'boolean' },
                created_at: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      }
    }
  }
}
