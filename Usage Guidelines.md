# WhatsApp Automation – Usage Guidelines & Anti-Ban Best Practices

> **Disclaimer:**  
> This project uses [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js), an unofficial library that simulates WhatsApp Web to automate messaging.  
> _Any automated or bulk actions **violate WhatsApp’s Terms of Service** and may result in temporary or permanent bans._  
> Use at your own risk.

---

## ⚠️ Anti-Ban Guidelines (Must Read)

To **minimize the risk of WhatsApp bans or restrictions**, you must strictly follow these rules and engineering best practices:

### 1. Only Reply to Inbound Messages

- Do not initiate conversations unless the user has messaged you first or has opted-in via a `wa.me` link.
- _Bots that send unsolicited or bulk messages get banned fast._

### 2. Message Rate Limits

- **New Numbers:** Max 20 new contacts per day for the first 10 days.
- **Warmed-up Numbers:** Up to 200 contacts per day is generally safe.
- **Never** send more than 100 messages in the first 5 minutes after registration.
- _Always warm up new numbers slowly by simulating normal user activity._

### 3. Add Random Delays ("Human-like" Sending)

- Wait **30–60 seconds** between messages.
- Send in small batches (20–30), then pause for 10–15 minutes.
- After 1 hour of continuous sending, pause for 1 hour.
- _This mimics real human usage and reduces detection._

### 4. Simulate Human Behavior

- Trigger `seen` and `typing` indicators before sending.
- Personalize messages with names, emojis, or slight variations.
- Set a profile picture and status.
- Do **not** run the bot 24/7; schedule downtime.

### 5. Obtain Explicit Opt-in & Honor Opt-out

- Require clear user consent before messaging.
- Store timestamp & evidence of consent.
- Provide a "STOP" keyword for users to opt-out and immediately cease messaging them.

### 6. Content Restrictions

- Never send spam, gambling, financial scams, or questionable/flagged content.
- Avoid sending links that are not HTTPS or may be previously flagged.

### 7. Number Warming & Usage

- Do not connect a new number to WhatsApp Web instantly—wait at least 24 hours.
- Use the number for normal 1:1 conversations for the first 10 days.
- Avoid adding to groups or mass broadcasts early on.

### 8. Infrastructure Hygiene

- Each number should use a unique, clean IP address.
- Avoid running multiple sessions for different numbers from the same IP/device.
- Never access the same account from different devices simultaneously.

### 9. Monitor & Respond to Warnings

- Watch for `UNPAIRED`, `CONFLICT`, or device bans in logs.
- Stop all sending if your account is flagged, reported, or if reports (`spam/block`) exceed 0.2%.
- Set up automated health checks and rate limiters.

---

## 🔧 Recommended Engineering Practices

- **Token-Bucket/Jitter Rate Limiting**: Use Redis or similar to enforce per-number send limits with random delays (jitter).
- **Service Isolation**: Run each WhatsApp instance in a dedicated Docker container behind a unique proxy for fingerprint isolation.
- **Dashboards/Alerts**: Monitor sends, errors, and block rates in real time using Grafana/Prometheus.
- **Migration Path**: For higher scale or proactive (cold) messaging, upgrade to the [official WhatsApp Business API](https://www.twilio.com/whatsapp), which is designed for automation at scale and minimizes risk.

---

## 🛑 Final Note

Even with all precautions, **risk of ban is never zero** when using unofficial APIs.  
For mission-critical business use, migrate to the official API as soon as feasible.

---

## References

- [whatsapp-web.js Discussions – Ban Prevention Tips](https://github.com/pedroslopez/whatsapp-web.js/discussions/2064)
- [Stack Overflow: How to avoid WhatsApp ban](https://stackoverflow.com/questions/68658085/avoid-being-banned-from-whatsapp-when-using-whatsapp-web-js)
- [Community Experiences & Engineering Blogs](https://dev.to/devdammak/avoid-whatsapp-bans-when-using-whatsapp-web-js-4oe1)
- Field-proven experience by developers in large automation projects

---

**Stay safe & code responsibly.**
