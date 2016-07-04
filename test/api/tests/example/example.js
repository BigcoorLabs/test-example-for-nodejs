export {test, req} from '../../common';

describe("Example Interface", () => {
    it('Provide other albums', () => test('/example/example.json'));
});