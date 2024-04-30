import { TestingAppChain } from "@proto-kit/sdk";
import { Character, Field, PrivateKey } from "o1js";
import { Balances } from "../src/balances";
import { Challenge } from "../src/challenge";
import { log } from "@proto-kit/common";
import { BalancesKey, TokenId, UInt64 } from "@proto-kit/library";

log.setLevel("ERROR");

describe("challenge", () => {
    const appChain = TestingAppChain.fromRuntime({
        Challenge,
    });

    let contract: Challenge;

    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();

    beforeAll(async () => {
        await appChain.start();
        appChain.setSigner(alicePrivateKey);

        contract = appChain.runtime.resolve("Challenge");

        contract.addAgent(Field(1), [new Character('A'), new Character('5')]);
        contract.addAgent(Field(2), [new Character('Z'), new Character('4')]);
    });



    it("add new message", async () => {
        let message: Message
        contract.addMessage
    }, 1_000_000);


});

function stringToCharacter(text: string): Character[] {
    return text.split('').map(x => new Character(x));
}
