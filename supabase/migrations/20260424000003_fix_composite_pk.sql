-- qq_conditions: (id, client_code) の複合主キーに変更
ALTER TABLE qq_conditions DROP CONSTRAINT qq_conditions_pkey;
ALTER TABLE qq_conditions ADD PRIMARY KEY (id, client_code);

-- departments: (id, client_code) の複合主キーに変更
ALTER TABLE departments DROP CONSTRAINT departments_pkey;
ALTER TABLE departments ADD PRIMARY KEY (id, client_code);
