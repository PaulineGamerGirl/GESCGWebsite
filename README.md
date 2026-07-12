# SCG Project Platform Website

## A Note on Security (Password Gating)

**To Pauline:**

Please note that the `/preacts` section of this website uses a **client-side password gate**. 

This means that the password (`PaulineForCAP`) and the actual content of the Pre-Acts are embedded directly into the website's source code (`data.js`). Anyone with basic technical knowledge can right-click the page, view the source code, and read the Pre-Act files without ever entering the password.

**This is a deterrent, not real security.** It is perfectly fine for keeping casual visitors or students out of the internal documents. However, **it is not a substitute for true security.** 

If any Pre-Act content in the `02_PreActs/` folder is genuinely sensitive (e.g., specific financial numbers, local business partner private details, or personal contact info), you must manually vet and redact that specific file before this website is deployed to a public URL. Do not assume the password gate makes it safe to publish highly confidential information.
