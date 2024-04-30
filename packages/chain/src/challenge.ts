import { runtimeModule, state, runtimeMethod, RuntimeModule } from "@proto-kit/module";
import { State, StateMap, assert } from "@proto-kit/protocol";
import { Balance, Balances as BaseBalances, TokenId, UInt64 } from "@proto-kit/library";
import { Bool, Field, Poseidon, PublicKey, Struct } from "o1js";
import { emptyValue } from "o1js/dist/node/lib/proof_system";

interface Message {
    MessageNumber: Field;
    MessageDetail: MessageDetail;
}

interface MessageDetail {
    AgentId: Field;
    Characters: [12];
    SecurityCode: [2];
}


export class AgentState extends Struct({
    LastMessage: Field,
    SecurityCode: Field,
}) {

    empty() {
        return new AgentState({ LastMessage: Field(0), SecurityCode: Field(0) });
    }

    isEmpty() {
        return Bool(this.LastMessage == Field(0) && this.SecurityCode == Field(0));
    }
}

@runtimeModule()
export class Challenge extends RuntimeModule<Message> {
    @state() public agentState = StateMap.from<Field, AgentState>(Field, AgentState);

    @runtimeMethod()
    public addAgent(
        AgentId: Field,
        SecurityCode: Field[]
    ): void {
        const agentStateCurrent = this.agentState.get(AgentId);
        assert(agentStateCurrent.value.isEmpty(), "Agent already Exist");
        assert(Bool(SecurityCode.length == 2), "Incorrect security code");
        const securityCodeHash = Poseidon.hash(SecurityCode);
        this.agentState.set(AgentId, new AgentState({ LastMessage: Field(0), SecurityCode: securityCodeHash }));
    }
}
