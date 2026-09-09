import assert from "node:assert/strict";
import { ROLE_BLUEPRINT, CATEGORY_BLUEPRINT, expectedCounts } from "./src/blueprint.js";

const roleKeys = ROLE_BLUEPRINT.map(x => x.key);
assert.equal(new Set(roleKeys).size, roleKeys.length, "role keys must be unique");
assert.deepEqual(roleKeys, ["admin", "moderator", "support", "member"]);

const categoryKeys = CATEGORY_BLUEPRINT.map(x => x.key);
assert.equal(new Set(categoryKeys).size, categoryKeys.length, "category keys must be unique");

const channelKeys = CATEGORY_BLUEPRINT.flatMap(c => c.channels.map(x => x.key));
assert.equal(new Set(channelKeys).size, channelKeys.length, "channel keys must be unique");
assert(channelKeys.includes("welcome"));
assert(channelKeys.includes("skin-studio"));
assert(channelKeys.includes("server-management"));
assert(channelKeys.includes("voice-general"));

const staff = CATEGORY_BLUEPRINT.find(c => c.key === "staff");
assert(staff?.staffOnly, "staff category must be private");
assert.equal(staff.channels.find(x => x.key === "server-management")?.staffAccess, "admin");

const counts = expectedCounts();
assert.equal(counts.roles, 4);
assert.equal(counts.categories, 8);
assert.equal(counts.channels, channelKeys.length);
assert(counts.channels >= 30, "expected a complete community layout");

console.log(`Primeval Refuge bot blueprint OK: ${counts.roles} roles, ${counts.categories} categories, ${counts.channels} channels.`);
