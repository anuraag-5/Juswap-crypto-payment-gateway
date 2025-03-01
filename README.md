# Juswap (Without Jupiter api key)

This project provides a simple swap interface, leveraging the Jupiter Aggregator API. **Please note that this version is designed to function without requiring a paid `JUPITER_API_KEY`**. As a result, it is subject to rate limiting and potential swap failures from the Jupiter side, particularly during periods of high demand.

**Important Considerations:**

* **Rate Limiting:** Without a dedicated API key, requests are subject to Jupiter's public rate limits. This can lead to occasional failures.
* **Reliability:** For 100% reliability and to avoid rate limiting, consider using the alternative version of this project: [Juswap-2](https://github.com/anuraag-5/Juswap-2).

## Juswap-2 (API-Key Enabled)

For users who have a `NEXT_PUBLIC_JUPITER_API_KEY`, I have created a second version of this project. By passing your own Jupiter API key as an environment variable, you can bypass rate limiting and ensure consistent, reliable swaps.

**Key Difference:**

* **`NEXT_PUBLIC_JUPITER_API_KEY` Support:** Juswap-2 allows you to provide your own API key, eliminating rate-limiting issues.

**Why Two Versions?**

I understand that the `JUPITER_API_KEY` can be expensive (300 USDC per month). This project (Juswap) aims to provide functionality for users who cannot afford the API key. Juswap-2 is for those who can, and want guaranteed reliability.

---

**(More content will be added here as provided)**