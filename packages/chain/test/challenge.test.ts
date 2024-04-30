import { TestingAppChain } from "@proto-kit/sdk";
import { Character, Field, PrivateKey } from "o1js";
import { Balances } from "../src/balances";
import { Challenge, Message } from "../src/challenge";
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

        let message: Message = {
            MessageNumber: Field(1),
            MessageDetail: {
                AgentId: Field(1),
                SecurityCode: [new Character('A'), new Character('5')],
                Message: stringToCharacter("test12345678")
            }
        };
        appChain.configurePartial({
            Runtime: {
                Balances: {},
                Challenge: message,
            },
        });
        await appChain.start();
        appChain.setSigner(alicePrivateKey);
        contract = appChain.runtime.resolve("Challenge");

        contract.addAgent(Field(1), [new Character('A'), new Character('5')]);
        contract.addAgent(Field(2), [new Character('Z'), new Character('4')]);
    });



    it("add new message", async () => {
        let message: Message = {
            MessageNumber: Field(1),
            MessageDetail: {
                AgentId: Field(1),
                SecurityCode: [new Character('A'), new Character('5')],
                Message: stringToCharacter("test12345678")
            }
        };
        const tx1 = await appChain.transaction(alice, () => {
            contract.addMessage(message);
        });

        await tx1.sign();
        await tx1.send();

        const block = await appChain.produceBlock();
    });
});



function stringToCharacter(text: string): Character[] {
    return text.split('').map(x => new Character(x));
}
