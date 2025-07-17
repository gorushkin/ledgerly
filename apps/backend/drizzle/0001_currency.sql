-- Custom SQL migration file, put your code below! --INSERT INTO currencies (code, name, symbol) VALUES
INSERT INTO
    currencies (code, name, symbol)
VALUES ('USD', 'US Dollar', '$'),
    ('EUR', 'Euro', '€'),
    ('GBP', 'British Pound', '£'),
    ('JPY', 'Japanese Yen', '¥'),
    ('CHF', 'Swiss Franc', 'CHF'),
    (
        'CAD',
        'Canadian Dollar',
        'C$'
    ) ON CONFLICT (code) DO NOTHING;