document.addEventListener('DOMContentLoaded', function() {
  const shareButton = document.getElementById('shareButton');
  const tagsInput = document.getElementById('tags');
  const statusDiv = document.getElementById('status');

  shareButton.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(Boolean);

      // Get page metadata
      const metadata = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => ({
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.content || '',
          image: document.querySelector('meta[property="og:image"]')?.content || ''
        })
      });

      const data = {
        url: tab.url,
        title: metadata[0].result.title,
        description: metadata[0].result.description,
        thumbnail: metadata[0].result.image,
        tags
      };

      // Send to your API
      const response = await fetch('https://your-api.com/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add your auth headers here
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Failed to share');

      statusDiv.className = 'status success';
      statusDiv.textContent = 'Successfully shared!';
      
      setTimeout(() => {
        window.close();
      }, 1500);
    } catch (error) {
      statusDiv.className = 'status error';
      statusDiv.textContent = 'Failed to share: ' + error.message;
    }
  });
});