document.addEventListener('DOMContentLoaded', function() {
  const shareButton = document.getElementById('shareButton');
  const tagsInput = document.getElementById('tagsInput');
  const statusDiv = document.getElementById('status');

  const AIRPARTY_URL = 'https://airparty.netlify.app';

  async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
  }

  async function getPageMetadata() {
    return {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content || '',
      image: document.querySelector('meta[property="og:image"]')?.content || 
             document.querySelector('meta[name="twitter:image"]')?.content || ''
    };
  }

  async function redirectToLogin() {
    await chrome.tabs.create({ url: `${AIRPARTY_URL}/login?extension=true` });
    window.close();
  }

  shareButton.addEventListener('click', async () => {
    try {
      // Vérifier l'authentification
      const { user } = await chrome.storage.local.get('user');
      
      if (!user) {
        redirectToLogin();
        return;
      }

      statusDiv.className = 'status loading';
      statusDiv.textContent = 'Sharing...';
      
      const tab = await getCurrentTab();
      const tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(Boolean);

      const [metadata] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: getPageMetadata
      });

      const data = {
        url: tab.url,
        title: metadata.result.title || tab.title,
        description: metadata.result.description || '',
        thumbnail: metadata.result.image || '',
        tags
      };

      // Simuler le partage (dans une vraie application, vous appelleriez votre API)
      await new Promise(resolve => setTimeout(resolve, 1000));

      statusDiv.className = 'status success';
      statusDiv.textContent = 'Successfully shared!';
      
      setTimeout(() => {
        window.close();
      }, 1500);
    } catch (error) {
      console.error('Share error:', error);
      statusDiv.className = 'status error';
      statusDiv.textContent = error.message || 'Failed to share';
    }
  });

  // Vérifier l'état de l'authentification à l'ouverture
  chrome.storage.local.get('user', ({ user }) => {
    if (!user) {
      shareButton.disabled = true;
      statusDiv.className = 'status error';
      statusDiv.innerHTML = 'Please <a href="#" id="loginLink">login to Airparty</a> first';
      
      document.getElementById('loginLink').addEventListener('click', (e) => {
        e.preventDefault();
        redirectToLogin();
      });
    } else {
      shareButton.disabled = false;
    }
  });
});