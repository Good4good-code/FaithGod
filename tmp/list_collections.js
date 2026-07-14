const { Firestore } = require('@google-cloud/firestore');

async function run() {
  const projectId = 'ai-studio-faithgod-e796b157-b4fa-46a9-94cf-2b459b8f39fa';
  console.log('Using projectId:', projectId);

  // Try 1: with databaseId: '(default)'
  try {
    const firestore = new Firestore({
      projectId: projectId,
      databaseId: '(default)',
    });
    console.log('Listing collections with (default) database...');
    const collections = await firestore.listCollections();
    console.log('Found collections:', collections.map(c => c.id));
  } catch (err) {
    console.error('Error with (default) database:', err.message);
  }

  // Try 2: with databaseId: projectId
  try {
    const firestore = new Firestore({
      projectId: projectId,
      databaseId: projectId,
    });
    console.log('Listing collections with custom databaseId...');
    const collections = await firestore.listCollections();
    console.log('Found collections:', collections.map(c => c.id));
  } catch (err) {
    console.error('Error with custom databaseId:', err.message);
  }
}

run();
