(function () {
    //Note: run given test module
    if (process.env.MODULE) {
        require(`./tests/${process.env.MODULE}`);
        return;
    }
    require('./tests/example/example');
})();
