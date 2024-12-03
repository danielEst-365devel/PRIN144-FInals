const fs = require('fs')
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml')

const file  =  fs.readFileSync(process.cwd() + '/swagger.yaml', 'utf8')
const swaggerDocument = YAML.parse(file)
const CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css"


const { sql } = require('@vercel/postgres');
require('dotenv').config();
const express = require('express')
const app = express();

// enable middleware to parse body of Content-type: application/json
app.use(express.json());

// Root endpoint to display name
app.get('/', (req, res) => {
    res.send('PRIN144-Final-Exam: Your Name');
});

// const PORT = 4000;

// app.listen(process.env.PORT || PORT, () => {
//     console.log(`Server is listening on port ${PORT}`)
// })

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
	customCss:
		'.swagger-ui .opblock .opblock-summary-path-description-wrapper { align-items: center; display: flex; flex-wrap: wrap; gap: 0 10px; padding: 0 10px; width: 100%; }',
	customCssUrl: CSS_URL,
}));

// Get all employees
app.get('/employees', async (req, res) => {
    if (req.query.id) {
        const employee = await sql`SELECT * FROM Employees WHERE Id = ${req.query.id};`;
        if (employee.rowCount > 0) {
            res.json(employee.rows[0]);
        } else {
            res.status(404).json({ message: 'Employee not found' });
        }
        return;
    }
    const employees = await sql`SELECT * FROM Employees ORDER BY Id;`;
    res.json(employees.rows);
});

// Get employee by id
app.get('/employees/:id', async (req, res) => {
    const id = req.params.id;
    const employee = await sql`SELECT * FROM Employees WHERE Id = ${id};`;
    if (employee.rowCount > 0) {
        res.json(employee.rows[0]);
    } else {
        res.status(404).json({ message: 'Employee not found' });
    }
});

// Create new employee
app.post('/employees', async (req, res) => {
    const { firstName, lastName, position, department, isWorkingFromHome } = req.body;
    const result = await sql`
        INSERT INTO Employees (FirstName, LastName, Position, Department, IsWorkingFromHome) 
        VALUES (${firstName}, ${lastName}, ${position}, ${department}, ${isWorkingFromHome || false})
        RETURNING Id;
    `;
    res.status(201).json({ id: result.rows[0].id });
});

// Update employee
app.put('/employees/:id', async (req, res) => {
    const id = req.params.id;
    const employee = await sql`SELECT * FROM Employees WHERE Id = ${id};`;
    
    if (employee.rowCount === 0) {
        return res.status(404).json({ message: 'Employee not found' });
    }

    const currentEmployee = employee.rows[0];
    const updatedEmployee = {
        firstName: req.body.firstName ?? currentEmployee.firstname,
        lastName: req.body.lastName ?? currentEmployee.lastname,
        position: req.body.position ?? currentEmployee.position,
        department: req.body.department ?? currentEmployee.department,
        isWorkingFromHome: req.body.isWorkingFromHome ?? currentEmployee.isworkingfromhome
    };

    await sql`
        UPDATE Employees 
        SET FirstName = ${updatedEmployee.firstName},
            LastName = ${updatedEmployee.lastName},
            Position = ${updatedEmployee.position},
            Department = ${updatedEmployee.department},
            IsWorkingFromHome = ${updatedEmployee.isWorkingFromHome}
        WHERE Id = ${id}
    `;

    const result = await sql`SELECT * FROM Employees WHERE Id = ${id};`;
    res.json(result.rows[0]);
});

// Delete employee
app.delete('/employees/:id', async (req, res) => {
    const id = req.params.id;
    const result = await sql`DELETE FROM Employees WHERE Id = ${id};`;
    if (result.rowCount > 0) {
        res.status(204).send();
    } else {
        res.status(404).json({ message: 'Employee not found' });
    }
});

module.exports = app;