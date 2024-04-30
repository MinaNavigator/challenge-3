import { runtimeModule, state, runtimeMethod, RuntimeModule } from "@proto-kit/module";
import { State, StateMap, assert } from "@proto-kit/protocol";
import { Balance, Balances as BaseBalances, TokenId, UInt64 } from "@proto-kit/library";
import { Bool, Character, CircuitString, Field, Poseidon, PublicKey, Struct } from "o1js";
import { emptyValue } from "o1js/dist/node/lib/proof_system";


export class MessageDetail extends Struct({
    AgentId: Field,
    Message: CircuitString,
    SecurityCode: CircuitString
}) { };

export class Message extends Struct({
    MessageNumber: Field,
    MessageDetail: MessageDetail
}) { };

export class AgentState extends Struct({
    LastMessage: Field,
    SecurityCode: Field
}) {

}


function checkLength(text: CircuitString, length: number) {
    text.values[length - 1].isNull().assertFalse("Incorrect length");
    text.values[length].isNull().assertTrue("Incorrect length");
}


@runtimeModule()
export class Challenge extends RuntimeModule<Record<string, never>> {
    @state() public agentState = StateMap.from<Field, AgentState>(Field, AgentState);

    @runtimeMethod()
    public addAgent(
        AgentId: Field,
        SecurityCode: CircuitString
    ): void {
        const agentStateCurrent = this.agentState.get(AgentId);
        agentStateCurrent.isSome.assertFalse("Agent already Exist");
        checkLength(SecurityCode, 2);
        const securityCodeHash = Poseidon.hash(SecurityCode.toFields());
        this.agentState.set(AgentId, new AgentState({ LastMessage: Field(0), SecurityCode: securityCodeHash }));
    }

    @runtimeMethod()
    public addMessage(
        Message: Message
    ): void {
        const agentStateCurrent = this.agentState.get(Message.MessageDetail.AgentId);
        //agentStateCurrent.isSome.assertTrue("Agent didn't exist");

        checkLength(Message.MessageDetail.SecurityCode, 2);
        checkLength(Message.MessageDetail.Message, 12);

        const securityCodeHash = Poseidon.hash(Message.MessageDetail.SecurityCode.toFields());
        assert(securityCodeHash.equals(agentStateCurrent.value.SecurityCode), "Incorrect security code");

        agentStateCurrent.value.LastMessage.assertLessThan(Message.MessageNumber, "Incorrect message number");

        agentStateCurrent.value.LastMessage = Message.MessageNumber;
        // update data with last message number
        this.agentState.set(Message.MessageDetail.AgentId, agentStateCurrent.value);
    }
}
