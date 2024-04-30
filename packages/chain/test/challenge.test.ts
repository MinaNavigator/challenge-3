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

        // add agent
        const tx1 = await appChain.transaction(alice, () => {
            contract.addAgent(Field(1), CircuitString.fromString("A5"));
        });
        await tx1.sign();
        await tx1.send();


        let block = await appChain.produceBlock();
    });

    it("add new message", async () => {

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

        await appChain.produceBlock();
        agent = await appChain.query.runtime.Challenge.agentState.get(Field(1));
        console.log("agent last message", agent?.LastMessage.toJSON());

        // You should update the agent state to store the last message number received.
        expect(agent?.LastMessage).toEqual(Field(1));
    });


    it("exist in system", async () => {
        let message: Message = {
            MessageNumber: Field(5),
            MessageDetail: {
                AgentId: Field(0),
                SecurityCode: CircuitString.fromString("A5"),
                Message: CircuitString.fromString("test12345678")
            }
        };
        const tx2 = await appChain.transaction(alice, () => {
            contract.addMessage(message);
        });

        await tx2.sign();
        await tx2.send();

        const block = await appChain.produceBlock();
        // The AgentID exists in the system
        expect(block?.transactions[0].statusMessage).toEqual("Agent didn't exist");
    });

    it("security code", async () => {
        let message: Message = {
            MessageNumber: Field(5),
            MessageDetail: {
                AgentId: Field(1),
                SecurityCode: CircuitString.fromString("ZZ"),
                Message: CircuitString.fromString("test12345678")
            }
        };
        const tx2 = await appChain.transaction(alice, () => {
            contract.addMessage(message);
        });

        await tx2.sign();
        await tx2.send();

        const block = await appChain.produceBlock();
        // The security code matches that held for that AgentID
        expect(block?.transactions[0].statusMessage).toEqual("Incorrect security code");
    });

    it("incorrect length", async () => {
        let message: Message = {
            MessageNumber: Field(5),
            MessageDetail: {
                AgentId: Field(1),
                SecurityCode: CircuitString.fromString("A5"),
                Message: CircuitString.fromString("small")
            }
        };

        // The message is of the correct length.
        await expect(async () => {
            await appChain.transaction(alice, () => {
                contract.addMessage(message);
            })
        }).rejects.toThrow("Incorrect length");

    });

    // it("Message number greather", async () => {

    //     let agent = await appChain.query.runtime.Challenge.agentState.get(Field(1));
    //     console.log("agent last message", agent?.LastMessage.toJSON());
    //     expect(agent?.LastMessage).toEqual(Field(0));

    //     let message: Message = {
    //         MessageNumber: Field(0),
    //         MessageDetail: {
    //             AgentId: Field(1),
    //             SecurityCode: CircuitString.fromString("A5"),
    //             Message: CircuitString.fromString("test12345678")
    //         }
    //     };

    //     // The message number is greater than the highest so far for that agent   
    //     await expect(async () => {
    //         await appChain.transaction(alice, () => {
    //             contract.addMessage(message);
    //         })
    //     }).rejects.toThrow("Incorrect message number");

    // });
});
