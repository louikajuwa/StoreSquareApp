<?php

return [
    'square' => [
        'application_id' => env('SQUARE_APPLICATION_ID'),
        'access_token'   => env('SQUARE_ACCESS_TOKEN'),
        'location_id'    => env('SQUARE_LOCATION_ID'),
        'environment'    => env('SQUARE_ENVIRONMENT', 'sandbox'),
    ],
    'realtime' => [
        'url' => env('REALTIME_SERVER_URL', 'http://node:3000'),
        'secret' => env('REALTIME_API_SECRET', 'realtime-secret-key'),
    ],
];
