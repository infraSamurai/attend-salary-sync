// Global request manager to prevent resource exhaustion
class RequestManager {
  private activeRequests = new Map<string, Promise<any>>();
  private requestQueue = new Map<string, number>();
  private readonly MAX_CONCURRENT_REQUESTS = 3;
  private readonly REQUEST_DELAY = 1000; // 1 second between similar requests

  async makeRequest(url: string, options: RequestInit): Promise<Response> {
    // Check if the same request is already in progress
    if (this.activeRequests.has(url)) {
      return this.activeRequests.get(url)!;
    }

    // Check rate limiting for this URL
    const lastRequest = this.requestQueue.get(url) || 0;
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequest;

    if (timeSinceLastRequest < this.REQUEST_DELAY) {
      // Wait for the remaining time
      const waitTime = this.REQUEST_DELAY - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Limit concurrent requests
    if (this.activeRequests.size >= this.MAX_CONCURRENT_REQUESTS) {
      throw new Error('Too many concurrent requests');
    }

    // Make the request
    const requestPromise = fetch(url, options).finally(() => {
      this.activeRequests.delete(url);
      this.requestQueue.set(url, Date.now());
    });

    this.activeRequests.set(url, requestPromise);
    return requestPromise;
  }

  // Clear all pending requests (useful on navigation/unmount)
  clearAll() {
    this.activeRequests.clear();
    this.requestQueue.clear();
  }
}

export const requestManager = new RequestManager();