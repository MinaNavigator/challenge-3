import { TestingAppChain } from "@proto-kit/sdk";
import { Character, CircuitString, Field, PrivateKey } from "o1js";
import { Challenge, Message, AgentState } from "../src/challenge";
import { log } from "@proto-kit/common";
import { Balances, BalancesKey, TokenId, UInt64 } from "@proto-kit/library";
import { cp } from "fs";

log.setLevel("ERROR");


describe("challenge", () => {
    let contract: Challenge;
    let appChain: ReturnType<
        typeof TestingAppChain.fromRuntime<{ Challenge: typeof Challenge }>
    >;

    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();

    beforeAll(async () => {
        appChain = TestingAppChain.fromRuntime({
            Challenge,
        });

        appChain.configurePartial({
            Runtime: {
                Challenge: {},
                Balances: {}
            },
        });


        await appChain.start();

        appChain.setSigner(alicePrivateKey);

        contract = appChain.runtime.resolve("Challenge");
    });



    it("add new message", async () => {

        // add agent
        const tx1 = await appChain.transaction(alice, () => {
            contract.addAgent(Field(1), CircuitString.fromString("A5"));
        });
        await tx1.sign();
        await tx1.send();


        let block = await appChain.produceBlock();

        let agent = await appChain.query.runtime.Challenge.agentState.get(Field(1));
        console.log("agent last message", agent?.LastMessage.toJSON());
        expect(agent?.LastMessage).toEqual(Field(0));

        let message: Message = {
            MessageNumber: Field(1),
            MessageDetail: {
                AgentId: Field(1),
                SecurityCode: CircuitString.fromString("A5"),
                Message: CircuitString.fromString("test12345678")
            }
        };
        const tx2 = await appChain.transaction(alice, () => {
            contract.addMessage(message);
        });

        await tx2.sign();
        await tx2.send();

        block = await appChain.produceBlock();
        agent = await appChain.query.runtime.Challenge.agentState.get(Field(1));
        console.log("agent last message", agent?.LastMessage.toJSON());
        expect(agent?.LastMessage).toEqual(Field(1));
    });
});
