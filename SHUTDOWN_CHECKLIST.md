# Firebase & Google Cloud Project Shutdown Checklist

## ⚠️ IMPORTANT: Order Matters!
Follow these steps in order to avoid issues and ensure complete shutdown.

## Step 1: Backup Important Data (If Needed)

### Export Firestore Data
```bash
# If you want to keep any data, export it first
gcloud firestore export gs://your-backup-bucket/firestore-backup

# Or manually export from Firebase Console:
# Firebase Console → Firestore → Settings → Export
```

### Download User Data
- Firebase Console → Authentication → Users → ⋮ → Download as CSV

### Save Your Code
- Ensure all code is committed to git
- Download any Cloud Functions source if not in your repo

## Step 2: Disable All Active Services

### 1. Disable Cloud Functions
```bash
# List all functions
firebase functions:list

# Delete all functions
firebase functions:delete submitBookingRequestWithPaymentAuth --force
firebase functions:delete acceptBookingRequestAndCaptureDeposit --force
firebase functions:delete declineBookingRequest --force
firebase functions:delete chargeFinalSessionPayment --force
firebase functions:delete createCustomPortalLink --force
firebase functions:delete handleStripeWebhook --force
firebase functions:delete testAuth --force
firebase functions:delete testSimpleFunction --force
firebase functions:delete testStripePayment --force
firebase functions:delete testFirestoreWrite --force
firebase functions:delete submitBookingRequestHTTP --force
firebase functions:delete submitBookingRequest --force
firebase functions:delete acceptBookingRequest --force

# Or delete all at once from Firebase Console:
# Firebase Console → Functions → Select All → Delete
```

### 2. Remove Firebase Hosting
```bash
# Unpublish your site
firebase hosting:disable

# Or from Console:
# Firebase Console → Hosting → ⋮ → Delete site
```

### 3. Disable Firebase Authentication
- Firebase Console → Authentication → Settings → Sign-in providers
- Disable all providers (Email/Password, Google, etc.)
- Delete all users: Authentication → Users → Select all → Delete

### 4. Clear Firestore Database
```bash
# Delete all data (this might take time for large databases)
firebase firestore:delete --all-collections --force

# Or from Console:
# Firestore → ⋮ → Delete database
```

### 5. Delete Firebase Storage
- Firebase Console → Storage → Files → Select all → Delete
- Storage → Rules → Delete all rules (replace with `allow read, write: if false;`)

## Step 3: Cancel Stripe Webhooks & Integration

### Remove Stripe Webhooks
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. Find webhook endpoint: `https://us-central1-sweetdreamsstudios-7c965.cloudfunctions.net/handleStripeWebhook`
3. Click on it → ⋮ → Delete webhook

### Clean Up Stripe Test Data
1. Stripe Dashboard → Customers → Delete test customers
2. Stripe Dashboard → Payments → Cancel any pending payments

## Step 4: Google Cloud Platform Cleanup

### 1. Disable Billing
```bash
# First, check what's using resources
gcloud billing accounts list
gcloud projects list

# Unlink billing account from project
gcloud billing projects unlink sweetdreamsstudios-7c965
```

Or via Console:
1. [Google Cloud Console](https://console.cloud.google.com)
2. Billing → My Projects
3. Find `sweetdreamsstudios-7c965`
4. ⋮ → Disable billing

### 2. Delete Cloud Resources
```bash
# Check for any compute instances
gcloud compute instances list

# Check for any cloud storage buckets
gsutil ls

# Delete any buckets (BE CAREFUL - this is permanent)
gsutil rm -r gs://sweetdreamsstudios-7c965.appspot.com
gsutil rm -r gs://sweetdreamsstudios-7c965.firebasestorage.app

# Check for any BigQuery datasets
bq ls

# Check for any Pub/Sub topics
gcloud pubsub topics list
```

### 3. Disable APIs
Go to [Google Cloud Console → APIs & Services](https://console.cloud.google.com/apis/dashboard)

Disable these APIs (if enabled):
- Cloud Functions API
- Cloud Build API
- Cloud Storage API
- Firebase Management API
- Identity Toolkit API (Firebase Auth)
- Token Service API
- Firebase Rules API
- Cloud Firestore API
- FCM Registration API

### 4. Remove Service Accounts
1. IAM & Admin → Service Accounts
2. Delete any custom service accounts (keep default ones for now)

## Step 5: Firebase Project Shutdown

### Option A: Soft Shutdown (Recommended First)
This keeps the project but ensures no billable resources:

1. Firebase Console → Project Settings → General
2. Scroll down to "Your project"
3. Click "Disable Google Analytics" if enabled
4. Firebase Console → Usage and billing → Details & settings
5. Set spending limit to $0

### Option B: Complete Project Deletion (Permanent)
⚠️ **WARNING: This cannot be undone!**

1. Firebase Console → Project Settings → General
2. Scroll to bottom → "Delete project"
3. Type project ID: `sweetdreamsstudios-7c965`
4. Confirm deletion

This will:
- Delete all Firebase services
- Delete all data
- Remove all Cloud resources
- Cancel all billing

## Step 6: Verify Everything is Stopped

### Check for Active Resources
```bash
# Check if functions are deleted
firebase functions:list

# Check if Firestore is empty
firebase firestore:indexes

# Check Google Cloud resources
gcloud compute instances list
gcloud sql instances list
gsutil ls
```

### Monitor Billing for 24-48 Hours
1. [Google Cloud Billing Console](https://console.cloud.google.com/billing)
2. Check "Reports" → Filter by project
3. Verify no new charges appearing

### Check Firebase Console
1. Firebase Console → Usage and billing
2. Verify showing $0.00 for all services

## Step 7: Local Cleanup

### Remove Environment Variables
```bash
# Delete or rename these files
rm .env.local
rm .env.production
rm functions/.env

# Or rename to keep for reference
mv .env.local .env.local.backup
```

### Remove Firebase Config Files
```bash
# Remove or backup sensitive files
rm .firebaserc
rm firebase.json
rm firestore.rules
rm firestore.indexes.json
rm storage.rules

# Remove service account keys if any
rm *-key.json
rm serviceAccountKey.json
```

### Clear Firebase CLI Cache
```bash
# Logout from Firebase
firebase logout

# Clear any cached credentials
rm -rf ~/.config/firebase
rm -rf ~/.cache/firebase
```

## Monitoring Checklist

### Week 1 After Shutdown
- [ ] Check Google Cloud Billing - should show $0
- [ ] Check Stripe Dashboard - no active webhooks
- [ ] Verify no emails about service usage

### Week 2 After Shutdown
- [ ] Final billing check
- [ ] If charges appear, investigate immediately
- [ ] Consider deleting project completely if not done

### Month 1 After Shutdown
- [ ] Final billing statement should be $0
- [ ] Safe to delete Google Cloud project entirely
- [ ] Archive or delete local code if not needed

## Common Charges to Watch For

### What Might Still Bill You:
1. **Cloud Storage** - Leftover files in buckets
2. **Cloud Functions** - Functions not properly deleted
3. **Firestore** - Large amounts of stored data
4. **BigQuery** - Analytics data storage
5. **Cloud Build** - Build artifacts storage

### Free Tier Limits (Won't Bill):
- Firestore: 1GB storage, 50K reads/day
- Cloud Functions: 2M invocations/month
- Firebase Auth: 10K verifications/month
- Hosting: 10GB transfer/month

## Emergency Contact

If you see unexpected charges:
1. [Google Cloud Support](https://cloud.google.com/support)
2. File billing dispute immediately
3. Reference project ID: `sweetdreamsstudios-7c965`

## Final Notes

- **Keep the project in "disabled" state for 30 days** before deleting completely
- **Download your billing invoices** for tax records
- **Save this checklist** until you confirm zero charges for 2 months
- **Document the shutdown date**: ___________

---

*Shutdown initiated: [DATE]*
*Final verification: [DATE + 30 days]*
*Project deleted: [DATE + 60 days]*