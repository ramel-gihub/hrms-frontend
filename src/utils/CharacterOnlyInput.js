export default class CharacterOnlyInput {
    static sanitize(value) {
        return String(value ?? "").replace(/[^\p{L}\s'-]/gu, "");
    }
}