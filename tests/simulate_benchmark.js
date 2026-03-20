async function mockQuery(latency) {
    return new Promise(resolve => setTimeout(resolve, latency));
}

async function benchmark() {
    const latency = 10;

    console.log('--- Sequential execution ---');
    const startSeq = Date.now();
    await mockQuery(latency);
    await mockQuery(latency);
    await mockQuery(latency);
    await mockQuery(latency);
    await mockQuery(latency);
    const endSeq = Date.now();
    console.log(`Sequential time: ${endSeq - startSeq}ms`);

    console.log('--- Concurrent execution ---');
    const startCon = Date.now();
    await Promise.all([
        mockQuery(latency),
        mockQuery(latency),
        mockQuery(latency),
        mockQuery(latency),
        mockQuery(latency)
    ]);
    const endCon = Date.now();
    console.log(`Concurrent time: ${endCon - startCon}ms`);
}

benchmark();
