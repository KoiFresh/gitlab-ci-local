import assert, {AssertionError} from "assert";
import {handler} from "../../../src/handler";
import {WriteStreamsMock} from "../../../src/write-streams";

test("spec-schema-validation invalid spec schema", async () => {
    try {
        const writeStreams = new WriteStreamsMock();
        await handler({
            cwd: "tests/test-cases/spec-schema-validation",
            preview: true,
        }, writeStreams);
    } catch (e: any) {
        assert(e instanceof AssertionError, "e is not instanceof AssertionError");
        expect(e.message).toContain("Invalid .gitlab-ci.yml configuration!");
        return;
    }

    throw new Error("Error is expected but not thrown/caught");
});
