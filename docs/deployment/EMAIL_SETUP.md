# Email Service Setup Guide

**Service**: Resend
**Status**: Required for production
**Free Tier**: 3,000 emails/month, 100/day

---

## ⚠️ Current Limitations

### Free Tier Restriction

**You can ONLY send emails to the email address you used to sign up for Resend.**

**Example**:
- Resend account: `marc_jeanson@hotmail.com`
- Can send to: `marc_jeanson@hotmail.com` ✅
- Cannot send to: `user@gmail.com` ❌
- Cannot send to: `player@example.com` ❌

**Impact**: Registration emails will fail for all users except you.

---

## 🚀 Production Setup (Required)

### Step 1: Buy a Custom Domain

You MUST own a domain to send emails to any user.

**Recommended Registrars**:
- [Namecheap](https://www.namecheap.com/) ($8.88/year for .com)
- [Porkbun](https://porkbun.com/) ($9.13/year for .com)
- [Cloudflare](https://www.cloudflare.com/products/registrar/) ($9.77/year for .com, at-cost)

**Domain Suggestions**:
- `joffrecard.com` ⭐ Recommended
- `joffregame.com`
- `playjoffre.com`
- `joffre.game`
- `jaffreonline.com` (matches your email)

**Budget**: $10-15/year

---

### Step 2: Verify Domain in Resend

**1. Login to Resend Dashboard**
- Go to: https://resend.com/domains
- Click "Add Domain"

**2. Enter Your Domain**
```
joffrecard.com
```
(No www, no http://, just the domain)

**3. Add DNS Records**

Resend will provide DNS records to add. You'll need to add these to your domain registrar:

**SPF Record** (TXT):
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600
```

**DKIM Record** (TXT):
```
Type: TXT
Name: resend._domainkey
Value: [long string provided by Resend]
TTL: 3600
```

**DMARC Record** (TXT) - Optional but recommended:
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@joffrecard.com
TTL: 3600
```

**4. Wait for DNS Propagation**
- Usually: 5-30 minutes
- Maximum: 24-48 hours
- Check status: Resend dashboard will show "Verified" when done

---

### Step 3: Update Environment Variables

**Railway (Backend)**:
```bash
EMAIL_FROM=Joffre <noreply@joffrecard.com>
# or
EMAIL_FROM=Joffre Game <game@joffrecard.com>
# or
EMAIL_FROM=Jaffre Online <notifications@joffrecard.com>
```

**Important**:
- Must use YOUR verified domain
- Can use any email address @yourdomain.com
- Common choices: `noreply@`, `game@`, `notifications@`, `hello@`

---

### Step 4: Test Email Sending

**Test in Production**:
1. Go to your live site
2. Register with a friend's email (or your other email)
3. Check if verification email arrives
4. Check spam folder if not in inbox

**Check Resend Dashboard**:
- Go to: https://resend.com/emails
- See all sent emails
- Check delivery status
- View error logs if any

---

## 🧪 Development Setup (Current)

### Using onboarding@resend.dev

**For local development and testing**:

```bash
# backend/.env
EMAIL_FROM=Jaffre <onboarding@resend.dev>
RESEND_API_KEY=re_your_key_here
```

**Limitations**:
- ✅ Works immediately (no domain needed)
- ✅ Perfect for testing
- ❌ Can only send to YOUR email (signup email)
- ❌ Not suitable for production

**Test Registration**:
```bash
# Only works for your email
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "marc_jeanson@hotmail.com",  // Your Resend signup email
    "username": "testuser",
    "password": "SecurePassword123!"
  }'
```

---

## 📧 Email Templates

### Verification Email

**Subject**: "Verify Your Email - Joffre Card Game"

**Template Location**: `backend/src/utils/emailService.ts`

**Customization**:
- Company name: Search "Joffre Card Game" and replace
- Colors: Update gradient in HTML (`#d97706`, `#ea580c`)
- Logo: Add `<img>` tag in header section

---

### Password Reset Email

**Subject**: "Reset Your Password - Joffre Card Game"

**Expiration**: 1 hour

**Security Note**:
- Link is single-use
- Token is deleted after password reset
- 1-hour expiration prevents abuse

---

## 🔧 Configuration Reference

### Environment Variables

**Required**:
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=Your App <sender@yourdomain.com>
FRONTEND_URL=https://your-frontend.vercel.app
```

**Optional**:
```bash
# Skip email verification in development
SKIP_EMAIL_VERIFICATION=true  # Automatically verifies all users
```

---

### API Key Management

**Get API Key**:
1. Go to https://resend.com/api-keys
2. Click "Create API Key"
3. Name: "Production - Joffre Game"
4. Permissions: "Sending access" (default)
5. Copy key immediately (shown only once)

**Security**:
- ✅ Store in Railway environment variables (server-side only)
- ✅ Never commit to git
- ❌ Don't put in frontend (publicly accessible)
- ❌ Don't share in screenshots/logs

**Rotation** (if key is compromised):
1. Create new key in Resend dashboard
2. Update Railway environment variable
3. Delete old key
4. Test email sending

---

## 🔍 Troubleshooting

### Email Not Received

**Check 1: Spam Folder**
- Gmail often puts new sender domains in spam
- Mark as "Not Spam" to train filter
- Ask users to add sender to contacts

**Check 2: Resend Dashboard**
- https://resend.com/emails
- Check delivery status
- Look for bounce/error messages

**Check 3: DNS Records**
- Use: https://mxtoolbox.com/SuperTool.aspx
- Enter: `yourdomain.com`
- Verify SPF and DKIM records are present

**Check 4: Railway Logs**
```bash
# Look for email service logs
railway logs --service=backend | grep "Email"

# Should see:
✉️  Email service configured with Resend API
📧 Attempting to send verification email to user@example.com
✅ Verification email sent successfully to user@example.com
   Email ID: abc123...
```

---

### Domain Verification Failed

**Common Issues**:

1. **DNS Propagation Delay**
   - Wait 30 minutes and try again
   - Check: `nslookup -type=TXT resend._domainkey.yourdomain.com`

2. **Wrong DNS Provider**
   - Make sure you're adding records to correct domain
   - Some registrars have separate DNS management

3. **Typo in DNS Record**
   - Copy-paste exact values from Resend
   - Don't add extra spaces or quotes
   - Check TTL is reasonable (3600 or default)

---

### "Invalid from address" Error

**Cause**: Trying to send from unverified domain

**Solution**:
```bash
# ❌ Wrong (unverified)
EMAIL_FROM=game@unverified-domain.com

# ✅ Correct (verified in Resend)
EMAIL_FROM=game@joffrecard.com
```

---

### Rate Limit Exceeded

**Free Tier Limits**:
- 100 emails/day
- 3,000 emails/month

**Solutions**:
1. Upgrade Resend plan ($20/month for 50k emails)
2. Implement email queueing
3. Reduce verification emails (optional verification)

---

## 📊 Monitoring

### Key Metrics to Track

**Delivery Rate**:
```
(Emails Delivered / Emails Sent) * 100
Target: >95%
```

**Bounce Rate**:
```
(Bounced Emails / Emails Sent) * 100
Target: <5%
```

**Open Rate** (optional tracking):
```
(Opened Emails / Delivered Emails) * 100
Typical: 20-30% for verification emails
```

---

### Resend Dashboard

Monitor in real-time:
- https://resend.com/emails
- Filter by date, status, recipient
- Download CSV for analysis
- Set up webhook for automation

---

## 🎯 Best Practices

### 1. Email Design

- ✅ Mobile-responsive HTML
- ✅ Plain text fallback included
- ✅ Clear call-to-action button
- ✅ Branded colors and logo
- ✅ Footer with app info

### 2. Email Copy

- ✅ Friendly, conversational tone
- ✅ Clear instructions
- ✅ Expiration time mentioned
- ✅ Security warnings (password reset)
- ✅ Alternative text link (if button breaks)

### 3. Security

- ✅ HTTPS links only
- ✅ Tokens in URL (not email body)
- ✅ Single-use tokens
- ✅ Short expiration times
- ✅ Rate limiting on endpoints

### 4. User Experience

- ✅ Instant email delivery (<5s)
- ✅ Don't block registration if email fails
- ✅ Show clear error messages
- ✅ Allow email resend
- ✅ Provide support contact

---

## 🚦 Production Checklist

Before launching with email:

- [ ] Domain purchased and DNS configured
- [ ] Domain verified in Resend dashboard
- [ ] DNS records propagated (checked with nslookup)
- [ ] `EMAIL_FROM` updated to verified domain
- [ ] `RESEND_API_KEY` set in Railway
- [ ] Test registration with real email
- [ ] Test password reset flow
- [ ] Check emails arrive in inbox (not spam)
- [ ] Verify links work and redirect correctly
- [ ] Test email on mobile devices
- [ ] Set up monitoring/alerts
- [ ] Document email support process

---

## 💰 Cost Breakdown

### Option 1: onboarding@resend.dev (Current)

**Cost**: $0
**Limitation**: Testing only (can't send to real users)
**Suitable for**: Development, personal testing

---

### Option 2: Custom Domain + Free Tier

**Cost**: ~$10-15/year (domain only)
**Limits**: 3,000 emails/month, 100/day
**Suitable for**: MVP, early beta, small user base

**Calculation**:
- 100 users/day signup = 100 emails/day ✅
- 3,000 users/month signup = 3,000 emails/month ✅
- Includes verification + password reset emails

---

### Option 3: Custom Domain + Paid Tier

**Cost**: Domain + $20/month = ~$250/year
**Limits**: 50,000 emails/month, no daily limit
**Suitable for**: Growing app, production at scale

**When to upgrade**:
- Approaching 3,000 emails/month
- Want higher sending rate
- Need priority support

---

## 📞 Support

### Resend Support

- **Email**: support@resend.com
- **Docs**: https://resend.com/docs
- **Status**: https://resend.com/status
- **Community**: https://resend.com/community

### App-Specific Issues

- **Email service code**: `backend/src/utils/emailService.ts`
- **Environment vars**: Railway dashboard
- **DNS records**: Domain registrar
- **Logs**: `railway logs --service=backend | grep Email`

---

## 🔗 Quick Links

- [Resend Dashboard](https://resend.com/overview)
- [API Keys](https://resend.com/api-keys)
- [Domains](https://resend.com/domains)
- [Email Logs](https://resend.com/emails)
- [Documentation](https://resend.com/docs)
- [Pricing](https://resend.com/pricing)

---

*Last Updated: 2025-11-06*
*Sprint 3 Refactoring - Production Readiness*
