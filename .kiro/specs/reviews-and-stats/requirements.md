# Requirements Document

## Introduction

This feature adds two main capabilities to the Belleza Saludable appointment booking system:

1. **Client Reviews System**: Allows authenticated clients to leave star ratings and text comments after completing their treatments. A review notification appears in the client's session 2 hours after appointment completion. Reviews are displayed publicly in the client-facing app's testimonials section. The admin panel includes a dedicated section to view and moderate all reviews.

2. **Admin Statistics Section**: Provides the administrator with monthly appointment counts, monthly income summaries, extra income registration for cash/product sales, and a ranking of most performed services. Includes filtering by month to explore historical data.

**Prerequisite**: This spec assumes that client authentication (login/registration) already exists as a separate feature. Clients are authenticated and have active sessions when interacting with the review system.

## Glossary

- **Review_System**: The subsystem responsible for collecting, storing, and displaying client reviews
- **Notification_Service**: The subsystem responsible for showing review request alerts within the authenticated client session
- **Statistics_Module**: The admin panel subsystem that calculates and displays business metrics
- **Extra_Income_Registry**: The subsystem for recording additional income not tied to appointments (cash sales, product sales)
- **Client_App**: The public-facing React frontend where authenticated clients book appointments, view their profile, and interact with reviews
- **Admin_Panel**: The vanilla HTML/JS panel at /panel.html used by the single administrator
- **Appointment**: A scheduled treatment session with a client, stored in the appointments table (statuses: confirmed, cancelled, completed)
- **Review**: A client-submitted rating (1-5 stars) and optional text comment associated with a completed appointment
- **Star_Rating**: A numeric value from 1 to 5 representing client satisfaction
- **Authenticated_Client**: A client who has logged in with valid credentials and has an active session

## Requirements

### Requirement 1: Review Request Notification

**User Story:** As an authenticated client, I want to see a notification asking me to leave a review after my treatment is completed, so that I can share my experience while it is still fresh.

#### Acceptance Criteria

1. WHEN an Authenticated_Client accesses the Client_App and has an Appointment with status "completed" where 2 or more hours have elapsed since the appointment end time, THE Notification_Service SHALL display a review request alert within the client session
2. THE Notification_Service SHALL include the service name and appointment date in the review request alert
3. IF the Authenticated_Client has already submitted a Review for the associated Appointment, THEN THE Notification_Service SHALL not display the review request alert for that Appointment
4. WHEN the Authenticated_Client dismisses the review request alert without submitting a review, THE Notification_Service SHALL not display the alert again for the same Appointment

### Requirement 2: Review Submission

**User Story:** As an authenticated client, I want to submit a star rating and text comment about my treatment, so that I can express my satisfaction and help other clients make informed decisions.

#### Acceptance Criteria

1. WHEN an Authenticated_Client submits a Review, THE Review_System SHALL require a Star_Rating value between 1 and 5
2. WHEN an Authenticated_Client submits a Review, THE Review_System SHALL accept an optional text comment with a maximum length of 500 characters
3. THE Review_System SHALL associate each Review with the corresponding Appointment, client, and service
4. WHEN an Authenticated_Client submits a Review with valid data, THE Review_System SHALL store the Review and display a success confirmation message
5. IF an Authenticated_Client submits a Review with an invalid Star_Rating or exceeds the comment character limit, THEN THE Review_System SHALL display a descriptive validation error message
6. THE Review_System SHALL allow only one Review per Appointment

### Requirement 3: Public Reviews Display

**User Story:** As a client, I want to see real reviews from other clients on the app, so that I can trust the quality of the services offered.

#### Acceptance Criteria

1. THE Client_App SHALL display approved reviews in the testimonials section of the home page, replacing the current hardcoded testimonials
2. THE Client_App SHALL display for each review: the Star_Rating, the text comment, the client first name and last initial, and the service name
3. THE Client_App SHALL display reviews sorted by most recent first
4. THE Client_App SHALL display a maximum of 6 reviews in the testimonials section
5. IF no approved reviews exist, THEN THE Client_App SHALL display a placeholder message indicating that reviews are coming soon

### Requirement 4: Admin Reviews Management

**User Story:** As the administrator, I want to see and manage all client reviews from the admin panel, so that I can monitor client satisfaction and moderate review content.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a "Reseñas" section accessible from the sidebar navigation
2. THE Admin_Panel SHALL display all reviews in a table showing: client name, service name, Star_Rating, comment text, submission date, and approval status
3. WHEN the administrator changes the approval status of a Review, THE Admin_Panel SHALL update the Review status and reflect the change in the public display
4. THE Admin_Panel SHALL allow filtering reviews by approval status (pending, approved, rejected)
5. WHEN a new Review is submitted, THE Review_System SHALL set the initial approval status to "approved"

### Requirement 5: Monthly Appointments Statistics

**User Story:** As the administrator, I want to see how many appointments were completed each month, so that I can track business volume over time.

#### Acceptance Criteria

1. THE Statistics_Module SHALL display the total count of appointments for the current month by default
2. THE Statistics_Module SHALL display separate counts for confirmed, completed, and cancelled appointments in the selected month
3. WHEN the administrator selects a different month using the month filter, THE Statistics_Module SHALL recalculate and display appointment counts for the selected month
4. THE Statistics_Module SHALL allow navigation to any previous month within the current year and the previous year

### Requirement 6: Monthly Income Statistics

**User Story:** As the administrator, I want to see the total income generated from appointments each month, so that I can track revenue and business performance.

#### Acceptance Criteria

1. THE Statistics_Module SHALL calculate monthly appointment income by summing the service prices of all completed appointments in the selected month
2. THE Statistics_Module SHALL display the monthly income formatted as Argentine Pesos with thousand separators
3. WHEN the administrator selects a different month, THE Statistics_Module SHALL recalculate and display the income for the selected month
4. THE Statistics_Module SHALL display the combined total income (appointment income plus extra registered income) for the selected month

### Requirement 7: Extra Income Registration

**User Story:** As the administrator, I want to register additional income from cash sales or product sales for specific days, so that I can have a complete picture of business revenue.

#### Acceptance Criteria

1. WHEN the administrator registers extra income, THE Extra_Income_Registry SHALL require an amount, a date, and a description
2. THE Extra_Income_Registry SHALL validate that the amount is a positive numeric value greater than zero
3. WHEN extra income is successfully registered, THE Extra_Income_Registry SHALL store the entry and update the monthly income total
4. THE Statistics_Module SHALL display a list of extra income entries for the selected month with date, description, and amount
5. WHEN the administrator deletes an extra income entry, THE Extra_Income_Registry SHALL remove the entry and recalculate the monthly total

### Requirement 8: Most Performed Services Ranking

**User Story:** As the administrator, I want to see which services are most popular each month, so that I can make informed decisions about promotions and scheduling.

#### Acceptance Criteria

1. THE Statistics_Module SHALL display a ranking of services ordered by the number of completed appointments in the selected month
2. THE Statistics_Module SHALL show for each ranked service: the service name, the count of completed appointments, and the percentage relative to total completed appointments in that month
3. WHEN the administrator selects a different month, THE Statistics_Module SHALL recalculate and display the ranking for the selected month
4. IF no completed appointments exist for the selected month, THEN THE Statistics_Module SHALL display a message indicating no data is available
