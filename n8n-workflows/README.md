# n8n Workflow Templates

## 📁 Files in this Directory

- `email-workflow.json` - Email sending workflow via SMTP/SendGrid
- `whatsapp-workflow.json` - WhatsApp messaging workflow via Twilio

## 🚀 How to Import

### Step 1: Access n8n Instance
1. Check your email for the n8n invitation
2. Accept the invitation and login to the n8n instance
3. Navigate to the Workflows tab

### Step 2: Import Workflow

#### For Email Workflow:
1. Click "Add Workflow" → "Import from File"
2. Select `email-workflow.json` from this directory
3. Click "Import"
4. The workflow will open in the editor

#### For WhatsApp Workflow:
1. Click "Add Workflow" → "Import from File"
2. Select `whatsapp-workflow.json` from this directory
3. Click "Import"
4. The workflow will open in the editor

### Step 3: Configure Credentials

#### Email Workflow - SMTP Setup:
1. Click on the "Send Email" node
2. Click "Create New Credential" for SMTP
3. Enter your SMTP details:
   ```
   Host: smtp.gmail.com (or your SMTP server)
   Port: 587
   User: your-email@gmail.com
   Password: your-app-password
   ```
4. For Gmail, use [App Passwords](https://support.google.com/accounts/answer/185833)
5. For SendGrid, use `smtp.sendgrid.net` with API key as password

#### WhatsApp Workflow - Twilio Setup:
1. Click on the "Send WhatsApp via Twilio" node
2. Click "Create New Credential" for Twilio API
3. Enter your Twilio credentials:
   ```
   Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Auth Token: your_auth_token
   ```
4. Get credentials from [Twilio Console](https://console.twilio.com/)
5. Ensure you have a [Twilio WhatsApp number](https://www.twilio.com/whatsapp)

### Step 4: Activate Workflows

1. Click the toggle switch at the top right to **Activate** the workflow
2. Verify the status shows "Active" (green)
3. Copy the webhook URL from the Webhook node

### Step 5: Copy Webhook URLs

#### Email Webhook:
1. Open the Email workflow
2. Click on "Webhook - Email Trigger" node
3. Copy the **Production URL** (e.g., `https://your-n8n.com/webhook/email`)
4. Save this URL - you'll need it for Supabase secrets

#### WhatsApp Webhook:
1. Open the WhatsApp workflow
2. Click on "Webhook - WhatsApp Trigger" node
3. Copy the **Production URL** (e.g., `https://your-n8n.com/webhook/whatsapp`)
4. Save this URL - you'll need it for Supabase secrets

## 🧪 Testing Workflows

### Test Email Workflow:
```bash
curl -X POST https://your-n8n.com/webhook/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "subject": "Test Email from n8n",
    "body": "This is a test email triggered via webhook"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Email sent successfully",
  "to": "recipient@example.com",
  "timestamp": "2025-01-17T10:30:00.000Z"
}
```

### Test WhatsApp Workflow:
```bash
curl -X POST https://your-n8n.com/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "message": "Hello! This is a test WhatsApp message from n8n"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "WhatsApp message sent successfully",
  "to": "+1234567890",
  "messageId": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "status": "sent",
  "timestamp": "2025-01-17T10:30:00.000Z"
}
```

## 🔧 Workflow Details

### Email Workflow Architecture
```
Webhook Trigger → Send Email → Check Success → Response
     ↓                                              ↓
  POST /email                           Success/Error JSON
```

**Inputs:**
- `to` (required): Recipient email address
- `subject` (optional): Email subject (default: "Message from AI Agent")
- `body` (required): Email message body
- `from` (optional): Sender email (default: noreply@sparkmore.ch)

**Outputs:**
- Success: `{ success: true, message: "Email sent", to: "...", timestamp: "..." }`
- Error: `{ success: false, message: "Failed", error: "...", timestamp: "..." }`

### WhatsApp Workflow Architecture
```
Webhook Trigger → Send WhatsApp → Check Status → Response
     ↓                                               ↓
  POST /whatsapp                          Success/Error JSON
```

**Inputs:**
- `to` (required): Recipient phone number (E.164 format: +1234567890)
- `message` (required): WhatsApp message text

**Outputs:**
- Success: `{ success: true, message: "Sent", to: "...", messageId: "...", status: "sent" }`
- Error: `{ success: false, message: "Failed", error: "...", to: "..." }`

## 🔐 Security Notes

### Best Practices:
1. **Never commit credentials** to git repositories
2. **Use n8n credentials manager** to store sensitive data
3. **Enable webhook authentication** if your n8n instance supports it
4. **Rotate API keys** regularly
5. **Monitor execution logs** for suspicious activity

### Webhook Security:
- Consider adding authentication headers
- Implement rate limiting in n8n
- Use HTTPS only (never HTTP)
- Validate input data in workflows

## 🐛 Troubleshooting

### Email Workflow Issues

**Problem: Email not sending**
- Check SMTP credentials are correct
- Verify SMTP server allows connections
- Check spam/junk folder
- Review n8n execution logs

**Problem: Gmail blocking connection**
- Enable "Less secure app access" or use App Passwords
- Check 2FA settings
- Verify email address is correct

### WhatsApp Workflow Issues

**Problem: WhatsApp not delivered**
- Verify Twilio credentials (Account SID, Auth Token)
- Ensure phone number is in E.164 format (+1234567890)
- Check Twilio WhatsApp number is approved
- Verify recipient has WhatsApp installed
- Review Twilio logs in console

**Problem: Webhook returns error**
- Check workflow is Active (toggle on)
- Verify webhook URL is correct
- Test webhook directly with cURL
- Check n8n execution history for details

## 📊 Monitoring

### View Execution History:
1. Go to n8n Dashboard
2. Click "Executions" in left sidebar
3. View all workflow runs
4. Click on any execution to see details
5. Check for errors or warnings

### Common Issues:
- ❌ "Credentials not found" → Re-configure credentials in workflow
- ❌ "Webhook not active" → Activate the workflow (toggle switch)
- ❌ "Node not found" → Import the workflow again
- ❌ "Timeout error" → Check network connectivity

## 📈 Performance Tips

1. **Async execution**: Enable for non-critical workflows
2. **Error handling**: Add error workflows for failed executions
3. **Retry logic**: Configure automatic retries in n8n settings
4. **Monitoring**: Set up alerts for failed executions
5. **Logging**: Enable detailed logging during development

## 🔄 Updates and Maintenance

### To update a workflow:
1. Make changes in n8n editor
2. Save the workflow
3. Export as JSON (optional backup)
4. Test changes with webhook
5. Monitor first few executions

### Backup Workflows:
```bash
# Export workflows regularly
# n8n → Workflows → Click workflow → Settings → Download
```

## 🎯 Integration with AI Agent

These workflows are called by the Supabase Edge Function:

```typescript
// In supabase/functions/ai-agent/index.ts
const emailWebhook = Deno.env.get('N8N_EMAIL_WEBHOOK');
const whatsappWebhook = Deno.env.get('N8N_WHATSAPP_WEBHOOK');

// Called when user command is "send email"
fetch(emailWebhook, {
  method: 'POST',
  body: JSON.stringify({ to: '...', subject: '...', body: '...' })
});

// Called when user command is "send whatsapp"
fetch(whatsappWebhook, {
  method: 'POST',
  body: JSON.stringify({ to: '...', message: '...' })
});
```

## 📞 Support

If you need help:
1. Check n8n [Documentation](https://docs.n8n.io)
2. Review execution logs in n8n
3. Test webhooks with cURL
4. Check credentials are correctly configured

## ✅ Checklist

Before deploying:
- [ ] Workflows imported successfully
- [ ] Credentials configured (SMTP/Twilio)
- [ ] Workflows activated (green toggle)
- [ ] Webhook URLs copied
- [ ] Test emails received
- [ ] Test WhatsApp messages received
- [ ] URLs set in Supabase secrets
- [ ] Edge function can call webhooks

---

**Last Updated**: 2025-01-17  
**Version**: 1.0.0  
**Compatible with**: n8n v1.0+

