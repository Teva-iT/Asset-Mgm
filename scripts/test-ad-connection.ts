import fs from "fs";
import path from "path";
import { Client } from "ldapts";

function readEnvFileValue(filePath: string, key: string): string | undefined {
    if (!fs.existsSync(filePath)) return undefined;

    const fileContent = fs.readFileSync(filePath, "utf8");
    let matchedValue: string | undefined;

    for (const rawLine of fileContent.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;

        const separatorIndex = line.indexOf("=");
        if (separatorIndex === -1) continue;

        const envKey = line.slice(0, separatorIndex).trim();
        if (envKey !== key) continue;

        matchedValue = line.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
    }

    return matchedValue;
}

function getAdEnvValue(key: string) {
    const directValue = process.env[key]?.trim();
    if (directValue) {
        return { value: directValue, source: "process.env" };
    }

    const candidateFiles = [
        path.join(process.cwd(), ".env.local"),
        path.join(process.cwd(), "types/.env.local"),
    ];

    for (const filePath of candidateFiles) {
        const fileValue = readEnvFileValue(filePath, key);
        if (fileValue) {
            return { value: fileValue, source: path.relative(process.cwd(), filePath) };
        }
    }

    return { value: undefined, source: "missing" };
}

function getReadAdConfig() {
    const adUrl = getAdEnvValue("AD_URL");
    const readUser = getAdEnvValue("AD_READ_USER");
    const writeUser = getAdEnvValue("AD_WRITE_USER");
    const readPass = getAdEnvValue("AD_READ_PASS");
    const writePass = getAdEnvValue("AD_WRITE_PASS");
    const adBaseDn = getAdEnvValue("AD_BASE_DN");

    const bindDn = readUser.value || writeUser.value;
    const bindPass = readPass.value || (bindDn && writeUser.value && bindDn === writeUser.value ? writePass.value : undefined);

    return {
        adUrl,
        readUser,
        readPass,
        writeUser,
        writePass,
        adBaseDn,
        bindDn,
        bindPass,
    };
}

function maskValue(value: string | undefined) {
    if (!value) return "(missing)";
    if (value.length <= 4) return `${"*".repeat(value.length)} (${value.length} chars)`;
    return `${value.slice(0, 2)}***${value.slice(-2)} (${value.length} chars)`;
}

function escapeLdapQuery(value: string) {
    return value.replace(/[\\*()\0]/g, "\\$&");
}

async function main() {
    const query = process.argv[2] || "Ayoub.Bousbaa@mepha.ch";

    const config = getReadAdConfig();

    console.log("AD diagnostic");
    console.log("=============");
    console.log(`Query: ${query}`);
    console.log(`AD_URL: ${config.adUrl.value || "(missing)"} [source: ${config.adUrl.source}]`);
    console.log(`AD_READ_USER: ${config.readUser.value || "(missing)"} [source: ${config.readUser.source}]`);
    console.log(`AD_READ_PASS: ${maskValue(config.readPass.value)} [source: ${config.readPass.source}]`);
    console.log(`AD_WRITE_USER: ${config.writeUser.value || "(missing)"} [source: ${config.writeUser.source}]`);
    console.log(`AD_WRITE_PASS: ${maskValue(config.writePass.value)} [source: ${config.writePass.source}]`);
    console.log(`AD_BASE_DN: ${config.adBaseDn.value || "(missing)"} [source: ${config.adBaseDn.source}]`);
    console.log(`Effective bind user: ${config.bindDn || "(missing)"}`);
    console.log(`Effective bind pass: ${maskValue(config.bindPass)}`);
    console.log("");

    if (!config.adUrl.value || !config.bindDn || !config.bindPass || !config.adBaseDn.value) {
        console.error("Missing required AD settings. Bind test skipped.");
        process.exitCode = 1;
        return;
    }

    const client = new Client({
        url: config.adUrl.value,
        timeout: 8000,
        connectTimeout: 8000,
    });

    try {
        console.log("1. Attempting LDAP bind...");
        await client.bind(config.bindDn, config.bindPass);
        console.log("   Bind successful.");

        const safeQuery = escapeLdapQuery(query);
        const filter = `(&(objectClass=user)(objectCategory=person)(|(sAMAccountName=*${safeQuery}*)(displayName=*${safeQuery}*)(mail=*${safeQuery}*)))`;

        console.log("2. Running LDAP search...");
        console.log(`   Base DN: ${config.adBaseDn.value}`);
        console.log(`   Filter: ${filter}`);

        const { searchEntries } = await client.search(config.adBaseDn.value, {
            filter,
            scope: "sub",
            attributes: ["sAMAccountName", "displayName", "mail", "distinguishedName"],
            sizeLimit: 10,
        });

        console.log(`   Search completed. Results: ${searchEntries.length}`);

        for (const [index, entry] of searchEntries.entries()) {
            const anyEntry = entry as Record<string, unknown>;
            console.log(`   ${index + 1}. ${String(anyEntry.displayName || "(no displayName)")}`);
            console.log(`      username: ${String(anyEntry.sAMAccountName || "(none)")}`);
            console.log(`      email: ${String(anyEntry.mail || "(none)")}`);
            console.log(`      dn: ${String(anyEntry.distinguishedName || "(none)")}`);
        }

        if (searchEntries.length === 0) {
            console.log("   No entries found. Connection works, but the search returned nothing.");
        }
    } catch (error: any) {
        console.error("AD diagnostic failed.");
        console.error(`Error name: ${error?.name || "Unknown"}`);
        console.error(`Error message: ${error?.message || "Unknown error"}`);
        if (error?.code) console.error(`Error code: ${error.code}`);
        process.exitCode = 1;
    } finally {
        try {
            await client.unbind();
        } catch {
            // Ignore cleanup errors in diagnostics.
        }
    }
}

void main();
