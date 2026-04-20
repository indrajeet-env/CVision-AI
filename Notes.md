For Token Blacklisting, using Redis is the best practice, since it has better throughput, in real world scenerios, but for now in this prj, i am using our mongodb database only

Always use POST method for logout

4 Layer Architecutre

- UI
  => Components
  => Pages

- Hook
  => For managing state and api layers

- State => For storing data (Used to manage and store application data, especially during asynchronous operations like API calls.)
  => (When a user sends a request and the response takes time, state helps handle:
	•	loading
	•	success
	•	error states
	•	Implemented using separate context layers)

  Implemented using : 
  => auth.context.js
  => ai.context.js

- API 
  => For communication with backend
  => services
    => auth/api.jsx