const { Client } = require('@opensearch-project/opensearch');

const opensearch = new Client({
  node: process.env.OPENSEARCH_ENDPOINT,
});

exports.handler = async (event) => {
  const { query } = JSON.parse(event.body);

  try {
    const response = await opensearch.search({
      index: 'documents',
      body: {
        query: {
          match: {
            content: query,
          },
        },
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify(response.body.hits.hits.map((hit) => hit._source)),
    };
  } catch (error) {
    console.error('Error searching OpenSearch:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error searching OpenSearch' }),
    };
  }
};