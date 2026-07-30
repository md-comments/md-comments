function updatePatternVisibility() {
  const useConv = (document.getElementById('useConventionalCommits') as HTMLInputElement).checked;
  const group = document.getElementById('commitPatternGroup');
  if (group) {
    group.style.display = useConv ? 'none' : 'block';
  }
}

function saveSettings() {
  const fallbackToken = (document.getElementById('fallbackToken') as HTMLInputElement).value;
  const useConventionalCommits = (
    document.getElementById('useConventionalCommits') as HTMLInputElement
  ).checked;
  const commitPattern = (document.getElementById('commitPattern') as HTMLInputElement).value;
  const squashCommits = (document.getElementById('squashCommits') as HTMLInputElement).checked;
  const useFixupCommits = (document.getElementById('useFixupCommits') as HTMLInputElement).checked;
  const batchCommentsMode = (document.getElementById('batchCommentsMode') as HTMLInputElement)
    .checked;

  chrome.storage.local.set(
    {
      fallbackToken: fallbackToken.trim(),
      useConventionalCommits,
      commitPattern: commitPattern.trim(),
      squashCommits,
      useFixupCommits,
      batchCommentsMode,
    },
    () => {
      const status = document.getElementById('status');
      if (status) {
        status.classList.add('success');
        setTimeout(() => {
          status.classList.remove('success');
        }, 2000);
      }
    }
  );
}

function restoreSettings() {
  chrome.storage.local.get(
    {
      fallbackToken: '',
      useConventionalCommits: true,
      commitPattern: 'docs(comments): {action}',
      squashCommits: true,
      useFixupCommits: true,
      batchCommentsMode: true,
    },
    (items) => {
      (document.getElementById('fallbackToken') as HTMLInputElement).value =
        items.fallbackToken || '';
      (document.getElementById('useConventionalCommits') as HTMLInputElement).checked =
        items.useConventionalCommits;
      (document.getElementById('commitPattern') as HTMLInputElement).value = items.commitPattern;
      (document.getElementById('squashCommits') as HTMLInputElement).checked = items.squashCommits;
      (document.getElementById('useFixupCommits') as HTMLInputElement).checked =
        items.useFixupCommits;
      (document.getElementById('batchCommentsMode') as HTMLInputElement).checked =
        items.batchCommentsMode;
      updatePatternVisibility();
    }
  );
}

document.addEventListener('DOMContentLoaded', () => {
  restoreSettings();
  const useConvCheck = document.getElementById('useConventionalCommits');
  if (useConvCheck) {
    useConvCheck.addEventListener('change', updatePatternVisibility);
  }
});

const saveBtn = document.getElementById('saveBtn');
if (saveBtn) {
  saveBtn.addEventListener('click', saveSettings);
}
