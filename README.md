# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Local Installation

To install and run the application locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-name>
    ```
    Replace `<your-repository-url>` with the actual URL of your Git repository and `<repository-name>` with the name of the cloned directory.

2.  **Install dependencies:**
    Make sure you have Node.js and npm installed. Then, run the following command in the project's root directory:
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the root of your project by copying the example if one exists, or create it from scratch.
    ```bash
    cp .env.example .env 
    ```
    If `.env.example` doesn't exist, create `.env` and add any necessary environment variables. For this project, you might need to configure Genkit, particularly for Google AI services. Ensure you have a `GOOGLE_API_KEY` or have authenticated via `gcloud auth application-default login`.
    Example `.env` content:
    ```
    GOOGLE_API_KEY=your_google_api_key_here 
    # Add other environment variables if needed
    ```

4.  **Run the Development Servers:**
    You'll need to run two development servers: one for the Next.js application and one for Genkit.

    *   **Next.js App:**
        ```bash
        npm run dev
        ```
        This will typically start the app on `http://localhost:9002`.

    *   **Genkit Server:**
        In a separate terminal, run:
        ```bash
        npm run genkit:dev
        ```
        Or, if you want Genkit to watch for changes:
        ```bash
        npm run genkit:watch
        ```
        The Genkit development UI will usually be available at `http://localhost:4000`.

5.  **Access the application:**
    Open your browser and navigate to `http://localhost:9002` (or the port specified in your terminal output).

That's it! You should have the Fridge Feast application running locally.