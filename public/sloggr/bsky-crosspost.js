function onFormSubmit(e) {
  var props = PropertiesService.getScriptProperties();
  var handle = props.getProperty("BSKY_HANDLE");
  var password = props.getProperty("BSKY_APP_PASSWORD");

  if (!handle || !password) {
    throw new Error("Bluesky credentials not set in Script Properties.");
  }

  // Skip timestamp column and combine remaining answers
  var formResponse = e.values.slice(1);

  // Remove empty fields to avoid extra blank lines
  formResponse = formResponse.filter(function(value) {
    return value && value.trim() !== "";
  });

  var baseText = formResponse.join("\n");

  // Strip HTML tags
  baseText = baseText.replace(/<[^>]*>/g, "");

  var suffix = " - via sloggr";

  // Bluesky character limit
  var maxLength = 300;
  var allowedLength = maxLength - suffix.length;

  // Truncate if needed
  if (baseText.length > allowedLength) {
    baseText = baseText.substring(0, allowedLength - 1) + "…";
  }

  var postText = baseText + suffix;

  // Step 1: Login to Bluesky
  var loginPayload = {
    identifier: handle,
    password: password
  };
  var loginResponse = UrlFetchApp.fetch(
    "https://bsky.social/xrpc/com.atproto.server.createSession",
    {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(loginPayload),
      muteHttpExceptions: true
    }
  );

  var loginData = JSON.parse(loginResponse.getContentText());
  if (!loginData.accessJwt) {
    throw new Error("Bluesky login failed: " + loginResponse.getContentText());
  }
  var authToken = loginData.accessJwt;

  // Step 2: Post to Bluesky
  var postPayload = {
    repo: handle,
    collection: "app.bsky.feed.post",
    record: {
      "$type": "app.bsky.feed.post",
      text: postText,
      createdAt: new Date().toISOString()
    }
  };

  var postResponse = UrlFetchApp.fetch(
    "https://bsky.social/xrpc/com.atproto.repo.createRecord",
    {
      method: "post",
      contentType: "application/json",
      headers: { Authorization: "Bearer " + authToken },
      payload: JSON.stringify(postPayload),
      muteHttpExceptions: true
    }
  );

  if (postResponse.getResponseCode() !== 200) {
    throw new Error("Bluesky post failed: " + postResponse.getContentText());
  }
}
