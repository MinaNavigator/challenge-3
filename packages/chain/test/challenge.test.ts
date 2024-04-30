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
    beforeAll(async () => {
        appChain = TestingAppChain.fromRuntime({
            Challenge,
        });

        appChain.configurePartial({
            Runtime: {
                Challenge: new Map([[Field(0), new AgentState({ LastMessage: Field(0), SecurityCode: Field(22) })]]),
                Balances: {}
            },
        });

        await appChain.start();

        contract = appChain.runtime.resolve("Challenge");
    });



    it("add new message", async () => {
        const alicePrivateKey = PrivateKey.random();
        const alice = alicePrivateKey.toPublicKey();

        appChain.setSigner(alicePrivateKey);

        // add agent
        const tx1 = await appChain.transaction(alice, () => {
            contract.addAgent(Field(1), CircuitString.fromString("A5"));
            contract.addAgent(Field(2), CircuitString.fromString("Z4"));
        });
        await tx1.sign();
        await tx1.send();


        let block = await appChain.produceBlock();
        console.log("status", block?.transactions[0].statusMessage);

        let agent = await contract.agentState.get(Field(0));
        console.log(agent);

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

    });
});
