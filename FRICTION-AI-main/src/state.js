import { ref } from 'vue'

export const isInstallModalOpen = ref(false)

export function downloadAndShowGuide() {
  // Download only the zip file
  const file = 'extension.zip';
  const link = document.createElement('a');
  link.href = `/${file}`;
  link.download = file;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Show the guide modal
  isInstallModalOpen.value = true
}
