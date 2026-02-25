# Active Directory Write Hardening Guide

For Phase 3 (Automated AD Provisioning), it is **critical** that the Service Account used to write to Active Directory operates under the principle of least privilege. 

## Strict Service Account Permissions

Do **not** use Domain Admin credentials for the `AD_WRITE_USER`. The service account requires only the following delegated permissions:

1. **Target OUs Only:**
   The service account should only have permissions over specific, safe Organizational Units (OUs), such as `OU=Employees,DC=Teva,DC=corp` and `OU=SecurityGroups,DC=Teva,DC=corp`. It should not have rights over `OU=Domain Controllers` or `OU=AdminAccounts`.

2. **Add Member Permissions Only:**
   To facilitate generating logical access requests, the account only needs the ability to modify group memberships.
   - Specifically: `Write Property` on the `member` attribute for Group objects.
   - It does **not** need permissions to reset passwords, delete users, or modify other attributes like `department` or `title`.

3. **No Interactive Logon:**
   The `AD_WRITE_USER` should be denied interactive logon rights (`Deny log on locally` and `Deny log on through Remote Desktop Services`) via Group Policy.

4. **Dedicated Account:**
   Use a dedicated account (e.g., `SVC_AssetManager_ADWrite`) whose password is auto-rotated via a PAM solution if available, or stored securely in `.env.local` / Secret Manager.

## Environment Variables

Ensure your production environment uses a separate, elevated account only for write operations. Do not reuse the Read-Only account if you want absolute separation of duties.

```env
AD_WRITE_USER="SVC_AssetManager_ADWrite"
AD_WRITE_PASS="[SECURE_PASSWORD]"
```
