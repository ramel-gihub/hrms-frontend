export default class IntegerOnlyInput {
    static sanitize(value) {
        return String(value ?? "").replace(/[^0-9]/g, "");
    }
}