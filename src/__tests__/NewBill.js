/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import router from "../app/Router.js";
import mockStore from "../__mocks__/store";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then icon-mail in vertical layout should be highlighted ", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);

      await waitFor(() => screen.getByTestId("icon-mail"));
      const mailIcon = screen.getByTestId("icon-mail");

      const iconIsActivated = mailIcon.classList.contains("active-icon");

      expect(iconIsActivated).toBeTruthy();
    });
  });
  describe("When I select a file with an incorrect extension", () => {
    test("Then  file is then deleted and an error message is returned to the user", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // initialisation NewBill
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      // fonctionnalité séléction fichier
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      const input = screen.getByTestId("file");
      input.addEventListener("change", handleChangeFile);
      //fichier au mauvais format
      fireEvent.change(input, {
        target: {
          files: [
            new File(["image.gif"], "image.gif", {
              type: "image/gif",
            }),
          ],
        },
      });

      expect(handleChangeFile).toHaveBeenCalled();

      await waitFor(() =>
        screen.getByText("Extension requise : png, jpg ou jpeg")
      );

      expect(input.files[0].name).toBe("image.gif");
    });
  });

  describe("When I add a new bill", () => {
    test("Then it creates a new bill", () => {
      //page NewBill
      const html = NewBillUI();
      document.body.innerHTML = html;

      // initialisation champs bills
      const inputData = {
        type: "Hôtel et logement",
        name: "Virgina Hotel - Paris",
        datepicker: "2022-09-14",
        amount: "90",
        vat: "150",
        pct: "56",
        commentary:
          "Hôtel sobre, chambres claires avec Wi-Fi gratuit (certaines avec balcon), bar et salle de petit-déjeuner.",
        file: new File(["hotel"], "hotel.png", { type: "image/png" }),
      };
      // récupération éléments de la page
      screen.getByTestId("expense-type").value = inputData.type;
      screen.getByTestId("expense-name").value = inputData.name;
      screen.getByTestId("datepicker").value = inputData.datepicker;
      screen.getByTestId("amount").value = inputData.amount;
      screen.getByTestId("vat").value = inputData.vat;
      screen.getByTestId("pct").value = inputData.pct;
      screen.getByTestId("commentary").value = inputData.commentary;

      // on ajoute les donnée du form au localStorage
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "aa@aa.aa",
        })
      );

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      //initialisation du NewBill
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      //déclenchement de l'événement
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
    });
  });
});

//test d'intégration POST
describe("Given I am a user connected as Employee", () => {
  describe("When I am on NewBill Page and submit the form", () => {
    test("then it posts to API and fails with 400 message error on Bills page", async () => {
      jest.spyOn(mockStore, "bills");
      jest.spyOn(console, "error").mockImplementation(() => {});

      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      document.body.innerHTML = `<div id="root"></div>`;
      router();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      mockStore.bills = jest.fn().mockImplementation(() => {
        return {
          update: () => {
            return Promise.reject(new Error("Erreur 400"));
          },
          list: () => {
            return Promise.reject(new Error("Erreur 400"));
          },
        };
      });
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Send form
      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      await new Promise(process.nextTick);
      expect(console.error).toBeCalled();
    });
  });
});
