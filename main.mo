import OrderedMap "mo:base/OrderedMap";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Iter "mo:base/Iter";

persistent actor {
  transient let natMap = OrderedMap.Make<Nat>(Nat.compare);
  transient let textMap = OrderedMap.Make<Text>(Text.compare);

  var items = natMap.fromIter<Text>(Iter.fromArray([(2, "Two"), (0, "Zero"), (1, "One")]));
  var users = textMap.empty<Nat>();

  public func demo() : async [(Nat, Text)] {
    items := natMap.put(items, 3, "Three");
    users := textMap.put(users, "alice", 100);

    let item1 = natMap.get(items, 1); // ?"One"
    let hasUser = textMap.contains(users, "bob"); // false
    items := natMap.delete(items, 0);

    let doubled = natMap.map<Text, Text>(items, func(key, value) { value # "-" # value });

    Iter.toArray(natMap.entries(items)) // [(1, "One"), (2, "Two"), (3, "Three")]
  };
};
